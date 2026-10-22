import { adminRoute } from "../../../../lib/admin";
import { many, one } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async ({ req }) => {
  const st = new URL(req.url).searchParams.get("status");
  const summary = await one(`SELECT
    coalesce(sum(amount) FILTER (WHERE status IN ('captured','paid')),0)::float8 AS received,
    coalesce(sum(amount) FILTER (WHERE status IN ('created','pending')),0)::float8 AS pending,
    coalesce(sum(amount) FILTER (WHERE status='refunded'),0)::float8 AS refunded,
    count(*) FILTER (WHERE status='failed')::int AS failed FROM payments`);
  const rows = await many(`
    SELECT p.id, o.order_no, p.method, p.amount::float8 AS amount, p.status, p.razorpay_payment_id, p.created_at, u.phone
    FROM payments p JOIN orders o ON o.id=p.order_id JOIN users u ON u.id=o.user_id
    WHERE ($1::text IS NULL OR p.status=$1) ORDER BY p.created_at DESC LIMIT 200`, [st || null]);
  return { summary, rows };
});
