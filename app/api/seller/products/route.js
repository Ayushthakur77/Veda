import { sellerRoute } from "../../../../lib/seller";
import { cleanProduct, setImage, COLS } from "../../../../lib/validators";
import { many, tx } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export const GET = sellerRoute(async ({ seller }) => ({
  products: await many(`
    SELECT p.id, p.sku, p.name_en, p.category_id, c.name_en AS category, p.product_type, p.pack_size, p.mrp, p.selling_price, p.gst_percent, p.hsn_code,
           p.is_active, p.description_en, p.ingredients, p.usage_info,
           (SELECT url FROM product_images i WHERE i.product_id = p.id ORDER BY sort_order, id LIMIT 1) AS image_url,
           (SELECT coalesce(sum(qty_available),0)::int FROM inventory_batches b WHERE b.product_id = p.id AND b.expiry_date > current_date) AS stock
    FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.seller_id = $1 ORDER BY p.created_at DESC LIMIT 500`, [seller.id]),
  categories: await many(`SELECT id, name_en FROM categories WHERE is_active ORDER BY sort_order, name_en`),
}));

// New listings start INACTIVE: Veda reviews the listing (name, claims, GST, image) before it goes live.
export const POST = sellerRoute(async ({ body, seller }) => {
  const p = cleanProduct({ ...body, supply_source: "distributor" });
  p.is_active = false;
  const id = await tx(async (c) => {
    const r = await c.query(
      `INSERT INTO products (${COLS.join(",")}, seller_id) VALUES (${COLS.map((_, i) => "$" + (i + 1)).join(",")}, $${COLS.length + 1}) RETURNING id`,
      [...COLS.map((k) => p[k]), seller.id]);
    await setImage(c, r.rows[0].id, p.image);
    return r.rows[0].id;
  });
  return { id };
}, { write: true });
