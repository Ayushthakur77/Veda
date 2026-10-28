import { userRoute, Invalid } from "../../../../lib/shop";
import { tx } from "../../../../lib/db";
import { codConfig } from "../../../../lib/pay";
export const dynamic = "force-dynamic";

// Customer changes an unpaid online order to Cash on Delivery from the payment page.
export const POST = userRoute(async ({ body, user }) => {
  const cod = codConfig();
  if (!cod.enabled) throw new Invalid("Cash on Delivery is not available right now.");
  return tx(async (c) => {
    const { rows: [o] } = await c.query(`SELECT id, status, payment_status, payment_method, total::float8 AS total FROM orders WHERE order_no=$1 AND user_id=$2 FOR UPDATE`, [String(body.order_no || "").slice(0, 20), user.id]);
    if (!o) throw new Invalid("Order not found.");
    if (o.status !== "placed" || o.payment_status === "paid") throw new Invalid("This order can no longer be changed.");
    if (o.payment_method === "cod") return { ok: true, already: true };
    if (o.total > cod.max) throw new Invalid(`Cash on Delivery is available up to ${cod.max.toLocaleString("en-IN")} rupees. Please pay online for this order.`);
    await c.query(`UPDATE orders SET payment_method='cod', payment_status='pending' WHERE id=$1`, [o.id]);
    await c.query(`UPDATE payments SET status='abandoned' WHERE order_id=$1 AND status='created'`, [o.id]);
    await c.query(`INSERT INTO order_status_history (order_id, status, note) VALUES ($1,'placed','Switched to Cash on Delivery')`, [o.id]);
    return { ok: true };
  });
}, { write: true });
