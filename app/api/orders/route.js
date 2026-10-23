import { userRoute } from "../../../lib/shop";
import { many } from "../../../lib/db";
export const dynamic = "force-dynamic";
export const GET = userRoute(async ({ user }) => ({
  rows: await many(`SELECT o.order_no, o.status, o.payment_status, o.total::float8 AS total, o.created_at,
      (SELECT string_agg(name_snapshot, ', ' ORDER BY id) FROM order_items WHERE order_id=o.id) AS items
    FROM orders o WHERE o.user_id=$1 AND NOT (o.status='cancelled' AND o.payment_status IN ('pending','failed')) ORDER BY o.created_at DESC LIMIT 100`, [user.id]),
}));
