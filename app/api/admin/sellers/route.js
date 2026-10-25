import { adminRoute } from "../../../../lib/admin";
import { many } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async () => ({
  sellers: await many(`
    SELECT s.*, u.phone AS login_phone, u.email AS login_email,
      (SELECT count(*)::int FROM products p WHERE p.seller_id=s.id) AS products,
      (SELECT count(*)::int FROM products p WHERE p.seller_id=s.id AND NOT p.is_active) AS products_pending,
      (SELECT coalesce(sum(oi.unit_price*oi.quantity),0)::float8 FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.seller_id=s.id AND o.status='delivered') AS gross,
      (SELECT coalesce(sum(amount),0)::float8 FROM seller_payouts sp WHERE sp.seller_id=s.id) AS paid
    FROM sellers s JOIN users u ON u.id=s.user_id ORDER BY (s.status='pending') DESC, s.created_at DESC LIMIT 300`),
}));
