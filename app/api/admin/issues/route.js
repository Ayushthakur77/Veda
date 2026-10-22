import { adminRoute, Invalid, optStr, str } from "../../../../lib/admin";
import { many, one } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async ({ req }) => {
  const st = new URL(req.url).searchParams.get("status");
  const rows = await many(`
    SELECT i.id, i.subject, i.message, i.priority, i.status, i.admin_note, i.created_at, o.order_no, u.phone, u.name
    FROM support_issues i LEFT JOIN orders o ON o.id=i.order_id LEFT JOIN users u ON u.id=i.user_id
    WHERE ($1::text IS NULL OR i.status=$1) ORDER BY (i.status='resolved'), i.created_at DESC LIMIT 200`, [st || null]);
  return { rows };
});

export const POST = adminRoute(async ({ body }) => {
  const subject = str(body.subject, 160);
  if (!subject) throw new Invalid("Subject is required.");
  const priority = ["low", "normal", "high"].includes(body.priority) ? body.priority : "normal";
  let orderId = null, userId = null;
  const no = str(body.order_no, 20);
  if (no) {
    const o = await one(`SELECT id, user_id FROM orders WHERE order_no=$1`, [no]);
    if (!o) throw new Invalid("No order with that number.");
    orderId = o.id; userId = o.user_id;
  }
  const r = await one(`INSERT INTO support_issues (order_id, user_id, subject, message, priority) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [orderId, userId, subject, optStr(body.message, 2000), priority]);
  return { id: r.id };
}, { write: true });
