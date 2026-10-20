import { adminRoute, Invalid, isIntId } from "../../../../../lib/admin";
import { cleanCategory } from "../../../../../lib/validators";
import { one } from "../../../../../lib/db";
import { fail } from "../../../../../lib/http";

export const dynamic = "force-dynamic";

export const PUT = adminRoute(async ({ params, body }) => {
  if (!isIntId(params.id)) throw new Invalid("Bad id.");
  const c = cleanCategory(body);
  const r = await one(
    `UPDATE categories SET slug=$1, name_en=$2, name_hi=$3, emoji=$4, sort_order=$5, is_active=$6 WHERE id=$7 RETURNING id`,
    [c.slug, c.name_en, c.name_hi, c.emoji, c.sort_order, c.is_active, params.id]);
  return r ? { ok: true } : fail("Not found.", 404);
}, { write: true });

export const DELETE = adminRoute(async ({ params }) => {
  if (!isIntId(params.id)) throw new Invalid("Bad id.");
  const used = await one("SELECT count(*)::int AS n FROM products WHERE category_id = $1", [params.id]);
  if (used.n > 0) throw new Invalid(`This category has ${used.n} product(s). Move them first, or deactivate the category instead.`);
  await one("DELETE FROM categories WHERE id = $1 RETURNING id", [params.id]);
  return { ok: true };
}, { write: true });
