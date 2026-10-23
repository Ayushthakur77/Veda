import { userRoute, Invalid } from "../../../../lib/shop";
import { many, one } from "../../../../lib/db";
export const dynamic = "force-dynamic";
export const GET = userRoute(async ({ params, user }) => {
  const o = await one(`SELECT id, order_no, status, payment_status, subtotal::float8 AS subtotal, shipping_fee::float8 AS shipping_fee, total::float8 AS total, address_snapshot, created_at, cancel_reason FROM orders WHERE order_no=$1 AND user_id=$2`, [String(params.no).slice(0, 20), user.id]);
  if (!o) throw Object.assign(new Invalid("Order not found."), { status: 404 });
  const [items, history, shipment] = await Promise.all([
    many(`SELECT name_snapshot AS name, sum(quantity)::int AS qty, unit_price::float8 AS unit FROM order_items WHERE order_id=$1 GROUP BY name_snapshot, unit_price ORDER BY min(id)`, [o.id]),
    many(`SELECT status, created_at FROM order_status_history WHERE order_id=$1 AND coalesce(note,'') <> 'Awaiting payment' ORDER BY created_at, id`, [o.id]),
    one(`SELECT courier_name, awb_code, tracking_url FROM shipments WHERE order_id=$1 ORDER BY created_at DESC LIMIT 1`, [o.id]),
  ]);
  const { id, ...order } = o;
  return { order, items, history, shipment };
});
