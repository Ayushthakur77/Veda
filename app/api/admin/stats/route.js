import { adminRoute } from "../../../../lib/admin";
import { one, many } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async () => {
  const counts = await one(`SELECT
    (SELECT count(*)::int FROM products WHERE is_active) AS products,
    (SELECT count(*)::int FROM categories WHERE is_active) AS categories,
    (SELECT count(*)::int FROM users) AS customers,
    (SELECT count(*)::int FROM inventory_batches WHERE qty_available > 0 AND expiry_date <= current_date) AS expired_batches,
    (SELECT count(*)::int FROM inventory_batches WHERE qty_available > 0 AND expiry_date > current_date AND expiry_date <= current_date + 60) AS expiring_60,
    (SELECT count(*)::int FROM orders WHERE status = 'placed') AS new_orders,
    (SELECT count(*)::int FROM orders WHERE status IN ('confirmed','packed')) AS to_ship,
    (SELECT count(*)::int FROM orders WHERE status IN ('shipped','out_for_delivery')) AS in_transit,
    (SELECT count(*)::int FROM order_returns WHERE status IN ('requested','approved','picked_up')) AS open_returns,
    (SELECT count(*)::int FROM support_issues WHERE status <> 'resolved') AS open_issues,
    (SELECT coalesce(sum(total),0)::float8 FROM orders WHERE created_at::date = current_date AND status NOT IN ('cancelled','returned')) AS today_revenue`);
  const low = await many(`
    SELECT p.id, p.name_en, p.sku, coalesce(sum(b.qty_available) FILTER (WHERE b.expiry_date > current_date), 0)::int AS stock
    FROM products p JOIN inventory_batches b ON b.product_id = p.id WHERE p.is_active
    GROUP BY p.id HAVING coalesce(sum(b.qty_available) FILTER (WHERE b.expiry_date > current_date), 0) <= 10
    ORDER BY stock, p.name_en LIMIT 20`);
  const expiring = await many(`
    SELECT p.name_en, b.batch_no, b.expiry_date::text AS expiry_date, b.qty_available, (b.expiry_date - current_date) AS days_left
    FROM inventory_batches b JOIN products p ON p.id = b.product_id
    WHERE b.qty_available > 0 AND b.expiry_date <= current_date + 60 ORDER BY b.expiry_date LIMIT 20`);
  return { counts, low, expiring };
});
