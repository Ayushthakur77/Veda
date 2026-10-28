import { userRoute, Invalid } from "../../../../lib/shop";
import { many, one } from "../../../../lib/db";
import { payMode, codConfig } from "../../../../lib/pay";
export const dynamic = "force-dynamic";

const PENDING_MINUTES = 30;

// Everything the payment page needs for one unpaid online order of the logged-in customer.
export const GET = userRoute(async ({ req, user }) => {
  const no = new URL(req.url).searchParams.get("no") || "";
  const o = await one(`SELECT id, order_no, status, payment_status, payment_method, subtotal::float8 AS subtotal, shipping_fee::float8 AS shipping, total::float8 AS total, created_at FROM orders WHERE order_no=$1 AND user_id=$2`, [no.slice(0, 20), user.id]);
  if (!o) throw new Invalid("Order not found.");
  const items = await many(`SELECT p.slug, oi.name_snapshot AS name, sum(oi.quantity)::int AS qty, oi.mrp::float8 AS mrp, oi.unit_price::float8 AS price
    FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id=$1 GROUP BY p.slug, oi.name_snapshot, oi.mrp, oi.unit_price ORDER BY 2`, [o.id]);
  const gw = await one(`SELECT razorpay_order_id FROM payments WHERE order_id=$1 AND status='created' ORDER BY created_at DESC LIMIT 1`, [o.id]);
  const mrpTotal = items.reduce((t, i) => t + i.mrp * i.qty, 0);
  const sellTotal = items.reduce((t, i) => t + i.price * i.qty, 0);
  const cod = codConfig();
  const mode = payMode();
  return {
    order_no: o.order_no, status: o.status, payment_status: o.payment_status, payment_method: o.payment_method,
    total: o.total, shipping: o.shipping, mrpTotal: Math.round(mrpTotal * 100) / 100, discount: Math.round((mrpTotal - sellTotal) * 100) / 100,
    items, gateway_order_id: gw?.razorpay_order_id || null, mode, keyId: mode === "razorpay" ? process.env.RAZORPAY_KEY_ID : null,
    name: user.name || null, email: user.email || null, phone: user.phone || null,
    expiresAt: new Date(new Date(o.created_at).getTime() + PENDING_MINUTES * 60_000).toISOString(),
    cod: { enabled: cod.enabled, max: cod.max, ok: cod.enabled && o.total <= cod.max },
  };
});
