import { adminRoute, Invalid, isUuid, optStr, str } from "../../../../../lib/admin";
import { many, one, tx } from "../../../../../lib/db";
import { FLOW } from "../../../../../lib/orders";
import { restock } from "../../../../../lib/checkout";
import { liveBookingOn } from "../../../../../lib/livebooking";
import { envName } from "../../../../../lib/couriers/shadowfax";
import { availableProviders } from "../../../../../lib/couriers";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async ({ params }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad order id.");
  const order = await one(`SELECT o.*, o.total::float8 AS total_n, u.phone, u.name, u.email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=$1`, [params.id]);
  if (!order) throw new Invalid("Order not found.");
  const [items, history, shipment, payments, shipments, attempts] = await Promise.all([
    many(`SELECT name_snapshot, quantity, unit_price::float8 AS unit_price, mrp::float8 AS mrp FROM order_items WHERE order_id=$1 ORDER BY id`, [params.id]),
    many(`SELECT status, note, created_at FROM order_status_history WHERE order_id=$1 ORDER BY created_at, id`, [params.id]),
    one(`SELECT * FROM shipments WHERE order_id=$1 ORDER BY created_at DESC LIMIT 1`, [params.id]),
    many(`SELECT id, method, amount::float8 AS amount, status, razorpay_payment_id, created_at FROM payments WHERE order_id=$1 ORDER BY created_at`, [params.id]),
    many(`SELECT s.id, s.provider, s.courier_name, s.awb_code, s.tracking_url, s.status, s.courier_status, s.last_synced_at, sl.business_name AS seller FROM shipments s LEFT JOIN sellers sl ON sl.id=s.seller_id WHERE s.order_id=$1 AND s.provider IS NOT NULL ORDER BY s.created_at`, [params.id]),
    many(`SELECT state, client_order_id, awb_code, error, created_at FROM shipment_attempts WHERE order_id=$1 ORDER BY created_at DESC LIMIT 10`, [params.id]),
  ]);
  return { order, items, history, shipment, payments, shipments, attempts, couriers: availableProviders(), live_booking: await liveBookingOn(), courier_env: envName(), next: FLOW[order.status] || [] };
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
    if (to === "packed") {
      const pend = await c.query(`SELECT 1 FROM order_items WHERE order_id=$1 AND seller_id IS NOT NULL AND seller_status='pending' LIMIT 1`, [params.id]);
      if (pend.rows[0]) throw new Invalid("Seller(s) have not packed their items yet.");
    }
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
    if (to === "delivered") {
      const { rows: [co] } = await c.query(`SELECT payment_method, payment_status, total FROM orders WHERE id=$1`, [params.id]);
      if (co.payment_method === "cod" && co.payment_status !== "paid") {
        await c.query(`UPDATE orders SET payment_status='paid' WHERE id=$1`, [params.id]);
        await c.query(`INSERT INTO payments (order_id, method, amount, status) VALUES ($1,'cod',$2,'captured')`, [params.id, co.total]);
      }
    }
    if (["out_for_delivery", "delivered"].includes(to)) await c.query(`UPDATE shipments SET status=$2 WHERE order_id=$1`, [params.id, to]);
    await c.query(`INSERT INTO order_status_history (order_id, status, note) VALUES ($1,$2,$3)`, [params.id, to, note]);
    return { ok: true, status: to };
  });
}, { write: true });
