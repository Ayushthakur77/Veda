import { adminRoute } from "../../../../lib/admin";
import { cleanCategory } from "../../../../lib/validators";
import { many, one } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async () => ({
  categories: await many(`SELECT c.id, c.slug, c.name_en, c.name_hi, c.emoji, c.sort_order, c.is_active,
    (SELECT count(*)::int FROM products p WHERE p.category_id = c.id) AS product_count FROM categories c ORDER BY c.sort_order, c.id`),
}));

export const POST = adminRoute(async ({ body }) => {
  const c = cleanCategory(body);
  return { category: await one(
    `INSERT INTO categories (slug, name_en, name_hi, emoji, sort_order, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [c.slug, c.name_en, c.name_hi, c.emoji, c.sort_order, c.is_active]) };
}, { write: true });
