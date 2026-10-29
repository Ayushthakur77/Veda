import { adminRoute, Invalid, isUuid } from "../../../../../../lib/admin";
import { many, one, tx } from "../../../../../../lib/db";
import { createShipment, shiprocketEnabled } from "../../../../../../lib/shiprocket";

export const dynamic = "force-dynamic";

// POST: create Shiprocket shipment + AWB for a packed order and mark it shipped.
export const POST = adminRoute(async ({ params }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad order id.");
  if (!shiprocketEnabled()) throw new Invalid("Shiprocket is not configured (set SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD, SHIPROCKET_PICKUP_LOCATION).");
  const order = await one(`SELECT o.*, o.total::float8 AS total_n FROM orders o WHERE o.id=$1`, [params.id]);
  if (!order) throw new Invalid("Order not found.");
  if (order.status !== "packed") throw new Invalid("Mark the order as packed first.");
  if (await one(`SELECT 1 AS x FROM shipments WHERE order_id=$1 AND awb_code IS NOT NULL`, [params.id])) throw new Invalid("Shipment already created.");
  const [items, customer] = await Promise.all([
    many(`SELECT name_snapshot, quantity, unit_price::float8 AS unit_price FROM order_items WHERE order_id=$1`, [params.id]),
    one(`SELECT phone, email FROM users WHERE id=$1`, [order.user_id]),
  ]);
  let s;
  try { s = await createShipment({ order, items, customer }); }
  catch (e) { throw new Invalid("Shiprocket: " + e.message); }
  await tx(async (c) => {
    const { rows } = await c.query(`SELECT status FROM orders WHERE id=$1 FOR UPDATE`, [params.id]);
    if (rows[0]?.status !== "packed") throw new Invalid("Order changed meanwhile.");
    await c.query(`INSERT INTO shipments (order_id, shiprocket_order_id, shipment_id, courier_name, awb_code, tracking_url, shipping_cost, status, provider) VALUES ($1,$2,$3,$4,$5,$6,$7,'shipped','shiprocket')`,
      [params.id, s.shiprocket_order_id, s.shipment_id, s.courier_name, s.awb_code, s.tracking_url, s.shipping_cost]);
    await c.query(`UPDATE orders SET status='shipped' WHERE id=$1`, [params.id]);
    await c.query(`INSERT INTO order_status_history (order_id, status, note) VALUES ($1,'shipped',$2)`, [params.id, `Shiprocket · ${s.courier_name} · AWB ${s.awb_code}`]);
  });
  return { ok: true, ...s };
}, { write: true });
