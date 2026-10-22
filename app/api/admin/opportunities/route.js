import { adminRoute } from "../../../../lib/admin";
import { many } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async () => {
  const [outOfStock, expiring, noImage, noDesc, hotLowStock, noDeal] = await Promise.all([
    many(`SELECT p.id, p.name_en, p.sku FROM products p WHERE p.is_active AND EXISTS (SELECT 1 FROM inventory_batches b WHERE b.product_id=p.id)
          AND coalesce((SELECT sum(qty_available) FROM inventory_batches b WHERE b.product_id=p.id AND b.expiry_date > current_date),0)=0 ORDER BY p.name_en LIMIT 30`),
    many(`SELECT p.name_en, b.batch_no, b.qty_available, b.expiry_date::text AS expiry_date, (b.expiry_date-current_date) AS days_left
          FROM inventory_batches b JOIN products p ON p.id=b.product_id
          WHERE b.qty_available>0 AND b.expiry_date > current_date AND b.expiry_date <= current_date+90 ORDER BY b.expiry_date LIMIT 30`),
    many(`SELECT p.id, p.name_en, p.sku FROM products p WHERE p.is_active AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id) ORDER BY p.name_en LIMIT 30`),
    many(`SELECT p.id, p.name_en, p.sku FROM products p WHERE p.is_active AND coalesce(length(p.description_en),0) < 30 ORDER BY p.name_en LIMIT 30`),
    many(`SELECT i.name_snapshot AS name, sum(i.quantity)::int AS sold_30d FROM order_items i JOIN orders o ON o.id=i.order_id
          WHERE o.created_at >= now()-interval '30 days' AND o.status NOT IN ('cancelled','returned') GROUP BY 1 ORDER BY 2 DESC LIMIT 10`),
    many(`SELECT p.id, p.name_en FROM products p WHERE p.is_active AND p.mrp > p.selling_price AND NOT EXISTS (SELECT 1 FROM deals d WHERE d.product_id=p.id) ORDER BY (p.mrp-p.selling_price)/p.mrp DESC LIMIT 10`),
  ]);
  return { outOfStock, expiring, noImage, noDesc, hotLowStock, noDeal };
});
