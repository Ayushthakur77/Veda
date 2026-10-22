import { adminRoute } from "../../../../lib/admin";
import { many, one } from "../../../../lib/db";
import { STATUSES } from "../../../../lib/orders";

export const dynamic = "force-dynamic";
const PAGE = 30;

export const GET = adminRoute(async ({ req }) => {
  const sp = new URL(req.url).searchParams;
  const statuses = (sp.get("status") || "").split(",").filter((s) => STATUSES.includes(s));
  const q = (sp.get("q") || "").trim().slice(0, 40);
  const page = Math.max(0, parseInt(sp.get("page") || "0", 10) || 0);
  const where = []; const args = [];
  if (statuses.length) { args.push(statuses); where.push(`o.status = ANY($${args.length})`); }
  if (q) { args.push(`%${q}%`); where.push(`(o.order_no ILIKE $${args.length} OR u.phone LIKE $${args.length} OR u.name ILIKE $${args.length})`); }
  const W = where.length ? "WHERE " + where.join(" AND ") : "";
  const total = (await one(`SELECT count(*)::int AS n FROM orders o JOIN users u ON u.id=o.user_id ${W}`, args)).n;
  const rows = await many(`
    SELECT o.id, o.order_no, o.status, o.payment_status, o.total::float8 AS total, o.created_at, o.cancel_reason,
           u.phone, u.name, o.address_snapshot->>'city' AS city, o.address_snapshot->>'pincode' AS pincode,
           (SELECT count(*)::int FROM order_items i WHERE i.order_id=o.id) AS items,
           s.courier_name, s.awb_code, s.tracking_url
    FROM orders o JOIN users u ON u.id=o.user_id
    LEFT JOIN LATERAL (SELECT * FROM shipments WHERE order_id=o.id ORDER BY created_at DESC LIMIT 1) s ON true
    ${W} ORDER BY o.created_at DESC LIMIT ${PAGE} OFFSET ${page * PAGE}`, args);
  const counts = await many(`SELECT status, count(*)::int AS n FROM orders GROUP BY status`);
  return { rows, total, page, pageSize: PAGE, counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) };
});
