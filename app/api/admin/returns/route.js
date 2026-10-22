import { adminRoute, Invalid, isUuid, str } from "../../../../lib/admin";
import { many, one } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async ({ req }) => {
  const st = new URL(req.url).searchParams.get("status");
  const rows = await many(`
    SELECT r.id, r.order_id, o.order_no, o.total::float8 AS order_total, r.reason, r.status, r.refund_amount::float8 AS refund_amount,
           r.admin_note, r.created_at, u.phone, u.name
    FROM order_returns r JOIN orders o ON o.id=r.order_id JOIN users u ON u.id=o.user_id
    WHERE ($1::text IS NULL OR r.status=$1) ORDER BY r.created_at DESC LIMIT 200`, [st || null]);
  return { rows };
});

export const POST = adminRoute(async ({ body }) => {
  const orderNo = str(body.order_no, 20), reason = str(body.reason, 200);
  if (!orderNo || !reason) throw new Invalid("Order number and reason are required.");
  const o = await one(`SELECT id, status FROM orders WHERE order_no=$1`, [orderNo]);
  if (!o) throw new Invalid("No order with that number.");
  if (o.status !== "delivered") throw new Invalid("Returns can only be logged for delivered orders.");
  const r = await one(`INSERT INTO order_returns (order_id, reason) VALUES ($1,$2) RETURNING id`, [o.id, reason]);
  return { id: r.id };
}, { write: true });
