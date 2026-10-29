import { many, one, tx } from "./db";
import { Invalid } from "./admin";
import { providerFor } from "./couriers";
import { Uncertain } from "./couriers/shadowfax";
import { stateFromPincode } from "./invoice";
import { liveBookingOn, vedaPickupSetting } from "./livebooking";

const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const digits = (s) => String(s || "").replace(/\D/g, "").slice(-10);

async function vedaPickup() {
  const v = await vedaPickupSetting();
  const p = { name: v.name, contact: v.phone, address: v.address, city: v.city, state: v.state, pincode: v.pincode };
  const missing = [["name", p.name], ["phone", p.contact], ["address", p.address], ["city", p.city], ["pincode", p.pincode]].filter(([, x]) => !x).map(([k]) => k);
  if (missing.length) throw new Invalid(`Pickup address for Veda's own products is not set (missing: ${missing.join(", ")}). Fill "Veda pickup address" in the order screen. Seller products use the seller's own address.`);
  return p;
}

function sellerPickup(s) {
  return { name: s.business_name, contact: digits(s.phone), address: s.premises_address, city: s.city, state: stateFromPincode(s.pincode, "Delhi"), pincode: s.pincode, gstin: s.gstin };
}

function buildPayload(order, items, pick, invoiceNo, singleGroup, clientOrderId) {
  const a = order.address_snapshot || {};
  const cod = order.payment_method === "cod" && order.payment_status !== "paid";
  const lines = items.map((i) => {
    const gross = r2(i.unit_price * i.quantity), taxable = r2(gross / (1 + i.gst / 100));
    return { ...i, gross, taxable, tax: r2(gross - taxable) };
  });
  const gross = r2(lines.reduce((t, l) => t + l.gross, 0));
  const taxable = r2(lines.reduce((t, l) => t + l.taxable, 0));
  const delivery = singleGroup ? r2(order.shipping_fee) : 0;
  const intra = !a.pincode || stateFromPincode(a.pincode, a.state || "").toLowerCase() === String(pick.state).toLowerCase();
  const weight = Number(process.env.PKG_WEIGHT_GRAMS || 500);
  const pickup = { name: pick.name, contact: pick.contact, address_line_1: pick.address, address_line_2: "", city: pick.city, state: pick.state, pincode: Number(pick.pincode) };
  return {
    order_type: "marketplace",
    order_details: {
      client_order_id: clientOrderId, actual_weight: weight, volumetric_weight: weight,
      product_value: taxable, total_amount: gross + delivery, payment_mode: cod ? "COD" : "Prepaid", cod_amount: cod ? r2(gross + delivery) : 0,
      ...(pick.gstin ? { gstin_number: pick.gstin } : {}), order_service: "regular",
    },
    customer_details: {
      name: String(a.full_name || "Customer").slice(0, 100), contact: digits(a.phone), address_line_1: a.line1, address_line_2: [a.line2, a.landmark].filter(Boolean).join(", "),
      city: a.city, state: a.state || stateFromPincode(a.pincode, "Delhi"), pincode: Number(a.pincode),
    },
    pickup_details: pickup,
    rts_details: { ...pickup, address_line_2: "" },
    product_details: lines.map((l) => ({
      sku_name: l.name_snapshot, sku_id: String(l.sku || l.product_id).slice(0, 100), price: r2(l.unit_price * l.quantity), ...(l.hsn_code ? { hsn_code: l.hsn_code } : {}), ...(invoiceNo ? { invoice_no: invoiceNo } : {}),
      seller_details: { seller_name: pick.name, seller_address: pick.address, seller_state: pick.state, ...(pick.gstin ? { gstin_number: pick.gstin } : {}) },
      taxes: intra ? { cgst: r2(l.tax / 2), sgst: r2(l.tax - r2(l.tax / 2)), igst: 0, total_tax: l.tax } : { cgst: 0, sgst: 0, igst: l.tax, total_tax: l.tax },
      additional_details: { quantity: l.quantity },
    })),
  };
}

// Books every seller-group of a packed order with the courier. Safe to call again: booked groups are skipped, interrupted ones reconcile.
export async function bookOrder({ orderId, provider = "shadowfax", adminId }) {
  const p = providerFor(provider);
  if (!p || !p.enabled()) throw new Invalid(`Courier "${provider}" is not configured (set SHADOWFAX_TOKEN).`);
  if (!(await liveBookingOn())) throw new Invalid("Live courier booking is OFF. Turn it ON in the order screen (Courier switch) before booking a real pickup.");
  const order = await one(`SELECT *, shipping_fee::float8 AS shipping_fee FROM orders WHERE id=$1`, [orderId]);
  if (!order) throw new Invalid("Order not found.");
  if (order.status !== "packed") throw new Invalid("Mark the order as packed first.");
  if (order.payment_status !== "paid" && order.payment_method !== "cod") throw new Invalid("Payment is not completed for this order.");
  const a = order.address_snapshot || {};
  if (!/^\d{6}$/.test(String(a.pincode || "")) || !a.line1 || !a.city || !a.full_name || digits(a.phone).length !== 10) throw new Invalid("Delivery address is incomplete (name, phone, address, city, 6-digit pincode).");

  const items = await many(`SELECT oi.seller_id, oi.product_id, oi.name_snapshot, oi.quantity, oi.unit_price::float8 AS unit_price, oi.gst_percent::float8 AS gst, pr.sku, pr.hsn_code
    FROM order_items oi JOIN products pr ON pr.id = oi.product_id WHERE oi.order_id=$1 ORDER BY oi.id`, [orderId]);
  const groups = new Map();
  for (const it of items) (groups.get(it.seller_id || "veda") || groups.set(it.seller_id || "veda", []).get(it.seller_id || "veda")).push(it);
  const results = [];

  for (const [key, list] of groups) {
    const sellerId = key === "veda" ? null : key;
    const cancelled = await one(`SELECT count(*)::int AS n FROM shipments WHERE order_id=$1 AND provider=$2 AND COALESCE(seller_id,'00000000-0000-0000-0000-000000000000'::uuid) = COALESCE($3::uuid,'00000000-0000-0000-0000-000000000000'::uuid) AND status = 'cancelled'`, [orderId, provider, sellerId]);
    const clientOrderId = `${order.order_no}-${sellerId ? sellerId.slice(0, 6) : "V"}${cancelled.n ? "-R" + cancelled.n : ""}`; // new id after a cancellation, same id on retries (idempotency)
    const done = await one(`SELECT awb_code FROM shipments WHERE order_id=$1 AND provider=$2 AND COALESCE(seller_id,'00000000-0000-0000-0000-000000000000'::uuid) = COALESCE($3::uuid,'00000000-0000-0000-0000-000000000000'::uuid) AND status <> 'cancelled' AND awb_code IS NOT NULL`, [orderId, provider, sellerId]);
    if (done) { results.push({ group: key, ok: true, awb: done.awb_code, already: true }); continue; }
    try {
      let seller = null;
      if (sellerId) { seller = await one(`SELECT * FROM sellers WHERE id=$1`, [sellerId]); if (!seller) throw new Invalid("Seller record missing."); if (seller.status !== "approved") throw new Invalid(`Seller ${seller.business_name} is not approved.`); }
      const pick = seller ? sellerPickup(seller) : await vedaPickup();
      if (!/^\d{6}$/.test(String(pick.pincode))) throw new Invalid("Pickup pincode is invalid.");
      const inv = sellerId ? (await one(`SELECT invoice_no FROM seller_invoices WHERE order_id=$1 AND seller_id=$2`, [orderId, sellerId]))?.invoice_no : `INV-${order.order_no}`;
      const payload = buildPayload(order, list, pick, inv, groups.size === 1, clientOrderId);

      // local booking lock: one in-flight attempt per group; stale ones (crashed process) become "unknown" and are reconciled by the courier's duplicate check
      await one(`UPDATE shipment_attempts SET state='unknown', error='interrupted', finished_at=now() WHERE client_order_id=$1 AND state='started' AND created_at < now() - interval '2 minutes' RETURNING id`, [clientOrderId]);
      let attempt;
      try { attempt = await one(`INSERT INTO shipment_attempts (order_id, seller_id, provider, client_order_id, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id`, [orderId, sellerId, provider, clientOrderId, adminId || null]); }
      catch (e) { if (e.code === "23505") throw new Invalid("A booking for this parcel is already in progress. Wait a moment and refresh."); throw e; }

      let res;
      try { res = await p.createOrder(payload); }
      catch (e) {
        const state = e instanceof Uncertain ? "unknown" : "failed";
        await one(`UPDATE shipment_attempts SET state=$2, error=$3, finished_at=now() WHERE id=$1 RETURNING id`, [attempt.id, state, String(e.message).slice(0, 500)]);
        throw e instanceof Uncertain ? new Invalid(`${e.message} The parcel may or may not be booked — press Book again to check safely (no duplicate will be created).`) : new Invalid(e.message);
      }
      await tx(async (c) => {
        await c.query(`INSERT INTO shipments (order_id, seller_id, provider, client_order_id, courier_name, awb_code, tracking_url, status) VALUES ($1,$2,$3,$4,'Shadowfax',$5,$6,'booked')`,
          [orderId, sellerId, provider, clientOrderId, res.awb, null]);
        await c.query(`UPDATE shipment_attempts SET state='success', awb_code=$2, finished_at=now(), error=$3 WHERE id=$1`, [attempt.id, res.awb, res.reconciled ? "reconciled with existing courier booking" : null]);
      });
      results.push({ group: key, ok: true, awb: res.awb, reconciled: Boolean(res.reconciled) });
    } catch (e) {
      if (!(e instanceof Invalid) && !e.userMessage) throw e;
      results.push({ group: key, ok: false, error: e.userMessage || e.message });
    }
  }

  const allBooked = results.length > 0 && results.every((r) => r.ok);
  if (allBooked) {
    await tx(async (c) => {
      const { rows: [o] } = await c.query(`SELECT status FROM orders WHERE id=$1 FOR UPDATE`, [orderId]);
      if (o.status === "packed") {
        await c.query(`UPDATE orders SET status='shipped' WHERE id=$1`, [orderId]);
        await c.query(`INSERT INTO order_status_history (order_id, status, note) VALUES ($1,'shipped',$2)`, [orderId, `Booked with ${provider}: ${results.map((r) => r.awb).join(", ")}`]);
      }
    });
  }
  await one(`INSERT INTO audit_log (user_id, action, order_id, detail) VALUES ($1,'courier_book',$2,$3) RETURNING id`, [adminId || null, orderId, JSON.stringify(results.map((r) => ({ ok: r.ok, awb: r.awb || null, error: r.error || null }))).slice(0, 1000)]);
  return { results, allBooked };
}
