import { adminRoute, Invalid, isUuid, optStr, str } from "../../../../../lib/admin";
import { many, one, tx } from "../../../../../lib/db";
import { FLOW } from "../../../../../lib/orders";
import { restock } from "../../../../../lib/checkout";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async ({ params }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad order id.");
  const order = await one(`SELECT o.*, o.total::float8 AS total_n, u.phone, u.name, u.email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=$1`, [params.id]);
  if (!order) throw new Invalid("Order not found.");
  const [items, history, shipment, payments] = await Promise.all([
    many(`SELECT name_snapshot, quantity, unit_price::float8 AS unit_price, mrp::float8 AS mrp FROM order_items WHERE order_id=$1 ORDER BY id`, [params.id]),
    many(`SELECT status, note, created_at FROM order_status_history WHERE order_id=$1 ORDER BY created_at, id`, [params.id]),
    one(`SELECT * FROM shipments WHERE order_id=$1 ORDER BY created_at DESC LIMIT 1`, [params.id]),
    many(`SELECT id, method, amount::float8 AS amount, status, razorpay_payment_id, created_at FROM payments WHERE order_id=$1 ORDER BY created_at`, [params.id]),
  ]);
  return { order, items, history, shipment, payments, next: FLOW[order.status] || [] };
});

export const PATCH = adminRoute(async ({ params, body }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad order id.");
  const to = str(body.status, 20);
  const note = optStr(body.note, 300);
  return tx(async (c) => {
    const { rows } = await c.query(`SELECT id, status FROM orders WHERE id=$1 FOR UPDATE`, [params.id]);
    const o = rows[0];
    if (!o) throw new Invalid("Order not found.");
    if (!(FLOW[o.status] || []).includes(to)) throw new Invalid(`Cannot move an order from ${o.status} to ${to}.`);
    if (to === "shipped") {
      const courier = str(body.courier_name, 60), awb = str(body.awb_code, 60);
      if (!courier || !awb) throw new Invalid("Courier name and AWB / tracking number are required to mark shipped.");
      await c.query(`INSERT INTO shipments (order_id, courier_name, awb_code, tracking_url, status) VALUES ($1,$2,$3,$4,'shipped')`,
        [params.id, courier, awb, optStr(body.tracking_url, 500)]);
    }
    if (to === "cancelled") {
      const reason = str(body.cancel_reason, 300);
      if (!reason) throw new Invalid("Please give a cancellation reason.");
      await c.query(`UPDATE orders SET status='cancelled', cancel_reason=$2, cancelled_at=now() WHERE id=$1`, [params.id, reason]);
      await restock(c, params.id);
    } else {
      await c.query(`UPDATE orders SET status=$2 WHERE id=$1`, [params.id, to]);
    }
    if (["out_for_delivery", "delivered"].includes(to)) await c.query(`UPDATE shipments SET status=$2 WHERE order_id=$1`, [params.id, to]);
    await c.query(`INSERT INTO order_status_history (order_id, status, note) VALUES ($1,$2,$3)`, [params.id, to, note]);
    return { ok: true, status: to };
  });
}, { write: true });
