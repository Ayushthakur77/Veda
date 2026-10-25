import { many, one, query, tx } from "./db";
import { Invalid } from "./admin";
import { isServiceable } from "./pincode";
import { shippingConfig } from "./pay";

const round2 = (n) => Math.round(n * 100) / 100;
const PENDING_MINUTES = 30;

// Validates a cart [{slug, qty}] against the DB and prices it server-side. Prices include GST.
export async function quoteCart(items, runner = { many }) {
  if (!Array.isArray(items) || items.length === 0) throw new Invalid("Your cart is empty.");
  if (items.length > 30) throw new Invalid("Too many different items in the cart.");
  const want = new Map();
  for (const it of items) {
    const qty = Number(it?.qty);
    if (typeof it?.slug !== "string" || !Number.isInteger(qty) || qty < 1 || qty > 20) throw new Invalid("Invalid cart item.");
    want.set(it.slug, (want.get(it.slug) || 0) + qty);
  }
  const rows = await runner.many(`
    SELECT p.id, p.slug, p.name_en, p.mrp::float8 AS mrp, p.selling_price::float8 AS price, p.gst_percent::float8 AS gst,
           coalesce(dl.deal_price, p.selling_price)::float8 AS unit,
           b.has_batches, b.stock::int AS stock
    FROM products p
    LEFT JOIN LATERAL (SELECT deal_price FROM deals WHERE product_id = p.id AND now() BETWEEN starts_at AND ends_at ORDER BY deal_price LIMIT 1) dl ON TRUE
    LEFT JOIN LATERAL (SELECT count(*) > 0 AS has_batches, coalesce(sum(qty_available) FILTER (WHERE expiry_date > current_date), 0) AS stock
                       FROM inventory_batches WHERE product_id = p.id) b ON TRUE
    WHERE p.is_active AND p.slug = ANY($1)`, [[...want.keys()]]);
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const lines = [];
  for (const [slug, qty] of want) {
    const r = bySlug.get(slug);
    if (!r) throw new Invalid("A product in your cart is no longer available. Please review your cart.");
    if (r.has_batches && r.stock < qty) throw new Invalid(r.stock > 0 ? `Only ${r.stock} left of ${r.name_en}.` : `${r.name_en} is out of stock.`);
    lines.push({ productId: r.id, slug, name: r.name_en, qty, unit: round2(r.unit), mrp: r.mrp, gst: r.gst, tracked: r.has_batches });
  }
  const subtotal = round2(lines.reduce((s, l) => s + l.unit * l.qty, 0));
  const gstAmount = round2(lines.reduce((s, l) => s + (l.unit * l.qty * l.gst) / (100 + l.gst), 0));
  const { fee, freeAbove } = shippingConfig();
  const shipping = subtotal >= freeAbove ? 0 : fee;
  return { lines, subtotal, gstAmount, shipping, total: round2(subtotal + shipping), freeAbove };
}

// Puts reserved stock back (idempotent per order). Call inside a transaction.
export async function restock(c, orderId) {
  const { rows } = await c.query(`SELECT stock_restored FROM orders WHERE id = $1 FOR UPDATE`, [orderId]);
  if (!rows[0] || rows[0].stock_restored) return;
  await c.query(`UPDATE inventory_batches b SET qty_available = b.qty_available + s.q
                 FROM (SELECT batch_id, sum(quantity)::int AS q FROM order_items WHERE order_id = $1 AND batch_id IS NOT NULL GROUP BY batch_id) s
                 WHERE b.id = s.batch_id`, [orderId]);
  await c.query(`UPDATE orders SET stock_restored = TRUE WHERE id = $1`, [orderId]);
}

async function cancelPending(c, orderId, reason) {
  const { rows } = await c.query(`UPDATE orders SET status='cancelled', cancel_reason=$2, cancelled_at=now()
                                  WHERE id=$1 AND status='placed' AND payment_status IN ('pending','failed') RETURNING id`, [orderId, reason]);
  if (!rows[0]) return false;
  await c.query(`INSERT INTO order_status_history (order_id, status, note) VALUES ($1,'cancelled',$2)`, [orderId, reason]);
  await restock(c, orderId);
  return true;
}

// Cancels unpaid orders that have held stock too long (optionally only one user's).
export async function releaseStale(userId = null) {
  const rows = await many(`SELECT id FROM orders WHERE status='placed' AND payment_status IN ('pending','failed')
    AND ($1::uuid IS NULL OR user_id = $1) AND ($1::uuid IS NOT NULL OR created_at < now() - make_interval(mins => $2))`, [userId, PENDING_MINUTES]);
  for (const r of rows) await tx((c) => cancelPending(c, r.id, userId ? "Replaced by a new checkout" : "Payment not completed in time"));
}

export async function createOrder(user, items, addressId) {
  const addr = await one(`SELECT full_name, phone, line1, line2, landmark, city, state, pincode FROM addresses WHERE id = $1 AND user_id = $2`, [addressId, user.id]);
  if (!addr) throw new Invalid("Please choose a delivery address.");
  if (!isServiceable(addr.pincode)) throw new Invalid("Sorry, we currently deliver only in Delhi NCR.");
  await releaseStale(user.id);
  return tx(async (c) => {
    const q = await quoteCart(items, { many: async (sql, p) => (await c.query(sql, p)).rows });
    const { rows: [o] } = await c.query(
      `INSERT INTO orders (order_no, user_id, address_snapshot, subtotal, shipping_fee, gst_amount, total)
       VALUES ('VEDA-' || nextval('order_no_seq'), $1, $2, $3, $4, $5, $6) RETURNING id, order_no`,
      [user.id, addr, q.subtotal, q.shipping, q.gstAmount, q.total]);
    for (const l of q.lines) {
      if (!l.tracked) {
        await c.query(`INSERT INTO order_items (order_id, product_id, name_snapshot, quantity, mrp, unit_price, gst_percent) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [o.id, l.productId, l.name, l.qty, l.mrp, l.unit, l.gst]);
        continue;
      }
      let left = l.qty;
      const { rows: batches } = await c.query(
        `SELECT id, qty_available FROM inventory_batches WHERE product_id = $1 AND qty_available > 0 AND expiry_date > current_date ORDER BY expiry_date, received_at FOR UPDATE`, [l.productId]);
      for (const b of batches) {
        if (left === 0) break;
        const take = Math.min(left, b.qty_available);
        await c.query(`UPDATE inventory_batches SET qty_available = qty_available - $2 WHERE id = $1`, [b.id, take]);
        await c.query(`INSERT INTO order_items (order_id, product_id, batch_id, name_snapshot, quantity, mrp, unit_price, gst_percent) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [o.id, l.productId, b.id, l.name, take, l.mrp, l.unit, l.gst]);
        left -= take;
      }
      if (left > 0) throw new Invalid(`${l.name} just went out of stock. Please review your cart.`);
    }
    await c.query(`UPDATE order_items oi SET seller_id = p.seller_id FROM products p WHERE p.id = oi.product_id AND oi.order_id = $1`, [o.id]);
    await c.query(`INSERT INTO order_status_history (order_id, status, note) VALUES ($1,'placed','Awaiting payment')`, [o.id]);
    return { id: o.id, order_no: o.order_no, total: q.total };
  });
}

export async function abandonOrder(orderId, reason) { await tx((c) => cancelPending(c, orderId, reason)); }

// Marks a gateway payment as captured. Idempotent; amount must match.
export async function capturePayment({ gatewayOrderId, paymentId, method = null, amountPaise = null, userId = null }) {
  return tx(async (c) => {
    const { rows: [p] } = await c.query(
      `SELECT p.id, p.order_id, p.status, p.amount::float8 AS amount, o.user_id, o.status AS ostatus, o.order_no
       FROM payments p JOIN orders o ON o.id = p.order_id WHERE p.razorpay_order_id = $1 FOR UPDATE OF p`, [gatewayOrderId]);
    if (!p || (userId && p.user_id !== userId)) throw new Invalid("Payment not found.");
    if (amountPaise != null && Math.round(p.amount * 100) !== amountPaise) throw new Invalid("Payment amount mismatch.");
    if (["captured", "refunded"].includes(p.status)) return { order_no: p.order_no, already: true };
    await c.query(`UPDATE payments SET status='captured', razorpay_payment_id=$2, method=coalesce($3, method) WHERE id=$1`, [p.id, paymentId, method]);
    if (p.ostatus === "cancelled") {
      // paid after we released the stock: reopen if stock is still available, else leave for manual refund
      await c.query(`UPDATE orders SET payment_status='paid' WHERE id=$1`, [p.order_id]);
      await c.query(`INSERT INTO order_status_history (order_id, status, note) VALUES ($1,'cancelled','Payment received after cancellation - refund needed')`, [p.order_id]);
    } else {
      await c.query(`UPDATE orders SET payment_status='paid' WHERE id=$1`, [p.order_id]);
      await c.query(`INSERT INTO order_status_history (order_id, status, note) VALUES ($1,'placed','Payment received')`, [p.order_id]);
    }
    return { order_no: p.order_no };
  });
}

export async function failPayment(gatewayOrderId) {
  await query(`UPDATE payments SET status='failed' WHERE razorpay_order_id=$1 AND status IN ('created','pending')`, [gatewayOrderId]);
  await query(`UPDATE orders SET payment_status='failed' WHERE payment_status='pending' AND id IN (SELECT order_id FROM payments WHERE razorpay_order_id=$1)`, [gatewayOrderId]);
}
