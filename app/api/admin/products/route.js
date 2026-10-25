import { adminRoute } from "../../../../lib/admin";
import { cleanProduct, setImage, COLS } from "../../../../lib/validators";
import { many, tx } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async () => ({
  products: await many(`
    SELECT p.id, p.sku, p.slug, p.name_en, p.name_hi, p.category_id, c.name_en AS category, p.product_type, p.pack_size,
           p.mrp, p.selling_price, p.gst_percent, p.hsn_code, p.supply_source, p.is_active,
           p.description_en, p.description_hi, p.ingredients, p.usage_info, sl.business_name AS seller,
           (SELECT url FROM product_images i WHERE i.product_id = p.id ORDER BY sort_order, id LIMIT 1) AS image_url,
           (SELECT count(*)::int FROM inventory_batches b WHERE b.product_id = p.id) AS batches,
           (SELECT coalesce(sum(qty_available),0)::int FROM inventory_batches b WHERE b.product_id = p.id AND b.expiry_date > current_date) AS stock
    FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN sellers sl ON sl.id = p.seller_id ORDER BY p.created_at DESC, p.name_en LIMIT 500`),
}));

export const POST = adminRoute(async ({ body }) => {
  const p = cleanProduct(body);
  const id = await tx(async (c) => {
    const r = await c.query(
      `INSERT INTO products (${COLS.join(",")}) VALUES (${COLS.map((_, i) => "$" + (i + 1)).join(",")}) RETURNING id`,
      COLS.map((k) => p[k]));
    await setImage(c, r.rows[0].id, p.image);
    return r.rows[0].id;
  });
  return { id };
}, { write: true });
