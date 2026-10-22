import { adminRoute } from "../../../../lib/admin";
import { many, one } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async ({ req }) => {
  const days = Math.min(365, Math.max(7, parseInt(new URL(req.url).searchParams.get("days") || "30", 10) || 30));
  const k = await one(`SELECT
    count(*)::int AS orders,
    coalesce(sum(total) FILTER (WHERE status NOT IN ('cancelled','returned')),0)::float8 AS revenue,
    count(*) FILTER (WHERE status='delivered')::int AS delivered,
    count(*) FILTER (WHERE status='cancelled')::int AS cancelled,
    count(*) FILTER (WHERE status='returned')::int AS returned,
    count(DISTINCT user_id)::int AS customers
    FROM orders WHERE created_at >= now() - make_interval(days => $1)`, [days]);
  const pct = (n) => (k.orders ? Math.round((n / k.orders) * 1000) / 10 : 0);
  const live = k.orders - k.cancelled - k.returned;
  const daily = await many(`
    SELECT d::date::text AS day, coalesce(count(o.id),0)::int AS orders, coalesce(sum(o.total) FILTER (WHERE o.status NOT IN ('cancelled','returned')),0)::float8 AS revenue
    FROM generate_series(current_date - ($1::int - 1), current_date, '1 day') d
    LEFT JOIN orders o ON o.created_at::date = d::date GROUP BY d ORDER BY d`, [days]);
  const top = await many(`
    SELECT i.name_snapshot AS name, sum(i.quantity)::int AS units, sum(i.quantity*i.unit_price)::float8 AS revenue
    FROM order_items i JOIN orders o ON o.id=i.order_id
    WHERE o.created_at >= now() - make_interval(days => $1) AND o.status NOT IN ('cancelled','returned')
    GROUP BY i.name_snapshot ORDER BY units DESC LIMIT 10`, [days]);
  return { days, kpi: { ...k, aov: live > 0 ? Math.round(k.revenue / live) : 0, cancelRate: pct(k.cancelled), returnRate: pct(k.returned), deliveredRate: pct(k.delivered) }, daily, top };
});
