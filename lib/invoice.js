import { many, one } from "./db";
import { company } from "./company";
import { getUser } from "./auth/session";
import { sellerOf } from "./seller";

const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function stateFromPincode(pin, fallback = "") {
  const p = String(pin || "");
  if (/^11/.test(p)) return "Delhi";
  if (/^12[0-4]/.test(p)) return "Haryana";
  if (/^20[0-9]|^2[1-8]/.test(p)) return "Uttar Pradesh";
  return fallback;
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const below100 = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : ""));
const below1000 = (n) => (n >= 100 ? ONES[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + below100(n % 100) : "") : below100(n));
export function rupeesInWords(amount) {
  let rs = Math.floor(amount), ps = Math.round((amount - rs) * 100);
  if (ps === 100) { rs += 1; ps = 0; }
  if (rs === 0 && ps === 0) return "Zero Rupees Only";
  const parts = [];
  const cr = Math.floor(rs / 1e7), lk = Math.floor((rs % 1e7) / 1e5), th = Math.floor((rs % 1e5) / 1e3), rest = rs % 1000;
  if (cr) parts.push(below1000(cr) + " Crore");
  if (lk) parts.push(below100(lk) + " Lakh");
  if (th) parts.push(below100(th) + " Thousand");
  if (rest) parts.push(below1000(rest));
  let out = (parts.join(" ") || "Zero") + " Rupees";
  if (ps) out += " and " + below100(ps) + " Paise";
  return out + " Only";
}

// Builds the tax invoice(s) of an order — one per seller (Veda's own items form their own invoice).
// Returns { error } or { order, invoices:[...] }. `who` decides what the viewer may see.
export async function loadInvoices(orderNo, onlySeller) {
  const user = await getUser();
  if (!user) return { error: "login" };
  const o = await one(`SELECT o.*, o.subtotal::float8 AS subtotal_n, o.discount::float8 AS discount_n, o.shipping_fee::float8 AS shipping_n, o.total::float8 AS total_n,
      u.name AS user_name, u.phone AS user_phone FROM orders o JOIN users u ON u.id=o.user_id WHERE o.order_no=$1`, [orderNo]);
  if (!o) return { error: "notfound" };
  const mySeller = user.role === "admin" || o.user_id === user.id ? null : await sellerOf(user.id);
  if (user.role !== "admin" && o.user_id !== user.id && !mySeller) return { error: "notfound" };
  if (o.payment_status !== "paid") return { error: "unpaid" };

  const items = await many(`SELECT oi.seller_id, oi.name_snapshot, oi.quantity, oi.mrp::float8 AS mrp, oi.unit_price::float8 AS unit_price, oi.gst_percent::float8 AS gst,
      b.batch_no, b.expiry_date::text AS expiry, p.hsn_code
    FROM order_items oi LEFT JOIN inventory_batches b ON b.id=oi.batch_id LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=$1 ORDER BY oi.id`, [o.id]);
  const pay = await one(`SELECT method, razorpay_payment_id FROM payments WHERE order_id=$1 AND status IN ('captured','paid') ORDER BY created_at DESC LIMIT 1`, [o.id]);
  const sellers = await many(`SELECT s.*, si.invoice_no, si.created_at AS invoice_date FROM sellers s LEFT JOIN seller_invoices si ON si.seller_id=s.id AND si.order_id=$1 WHERE s.id = ANY($2::uuid[])`, [o.id, [...new Set(items.map((i) => i.seller_id).filter(Boolean))]]);
  const a = o.address_snapshot || {};
  const buyerState = stateFromPincode(a.pincode, a.state || "");
  const co = company();
  const groups = new Map();
  for (const it of items) { const k = it.seller_id || "veda"; (groups.get(k) || groups.set(k, []).get(k)).push(it); }
  const invoices = [];
  for (const [k, list] of groups) {
    if (mySeller && k !== mySeller.id) continue;
    if (onlySeller && onlySeller !== k) continue;
    const s = k === "veda" ? null : sellers.find((x) => x.id === k);
    const seller = s ? {
      name: s.business_name, address: `${s.premises_address}, ${s.city} ${s.pincode}`, gstin: s.gstin, licence: s.drug_licence_no,
      pharmacist: s.pharmacist_name, pharmacistReg: s.pharmacist_reg_no, state: stateFromPincode(s.pincode),
    } : { name: co.name, address: co.address, gstin: process.env.COMPANY_GSTIN || "", licence: process.env.COMPANY_DRUG_LICENCE || "", pharmacist: process.env.COMPANY_PHARMACIST || "", pharmacistReg: process.env.COMPANY_PHARMACIST_REG || "", state: process.env.COMPANY_STATE || "Delhi" };
    const intra = !buyerState || !seller.state || buyerState.toLowerCase() === seller.state.toLowerCase();
    const lines = list.map((i) => {
      const gross = r2(i.unit_price * i.quantity);
      const taxable = r2(gross / (1 + i.gst / 100));
      const tax = r2(gross - taxable);
      const half = r2(tax / 2);
      return { name: i.name_snapshot, hsn: i.hsn_code, batch: i.batch_no, expiry: i.expiry, qty: i.quantity, mrp: i.mrp, rate: r2(i.unit_price / (1 + i.gst / 100)), gst: i.gst, taxable, cgst: intra ? half : 0, sgst: intra ? r2(tax - half) : 0, igst: intra ? 0 : tax, gross, mrpTotal: r2(i.mrp * i.quantity) };
    });
    const sum = (f) => r2(lines.reduce((t, l) => t + l[f], 0));
    const single = groups.size === 1;
    const t = { mrpTotal: sum("mrpTotal"), taxable: sum("taxable"), cgst: sum("cgst"), sgst: sum("sgst"), igst: sum("igst"), gross: sum("gross") };
    t.discount = r2(t.mrpTotal - t.gross);
    const coupon = single ? r2(o.discount_n || 0) : 0;
    const delivery = single ? r2(o.shipping_n || 0) : 0;
    t.total = r2(t.gross - coupon + delivery);
    invoices.push({
      key: k, no: (s && s.invoice_no) || `INV-${o.order_no}${groups.size > 1 ? "-" + (k === "veda" ? "V" : String(k).slice(0, 4).toUpperCase()) : ""}`,
      date: (s && s.invoice_date) || o.created_at, seller, lines, intra, totals: t, coupon, delivery,
      deliveryNote: !single && o.shipping_n ? `Delivery charge ₹${o.shipping_n.toFixed(2)} for this order is billed separately by ${co.name}.` : null,
      words: rupeesInWords(t.total),
    });
  }
  return { order: { id: o.id, no: o.order_no, date: o.created_at, buyer: { name: a.full_name || o.user_name, phone: a.phone || o.user_phone, address: [a.line1, a.line2, a.landmark, a.city, buyerState, a.pincode].filter(Boolean).join(", ") }, pay: pay ? { method: pay.method, ref: pay.razorpay_payment_id } : null }, invoices, company: co };
}
