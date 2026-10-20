import { adminRoute, Invalid, isUuid } from "../../../../../lib/admin";
import { cleanProduct, setImage, COLS } from "../../../../../lib/validators";
import { tx, query } from "../../../../../lib/db";
import { fail } from "../../../../../lib/http";

export const dynamic = "force-dynamic";

export const PUT = adminRoute(async ({ params, body }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad id.");
  const p = cleanProduct(body);
  const ok = await tx(async (c) => {
    const r = await c.query(`UPDATE products SET ${COLS.map((k, i) => `${k}=$${i + 1}`).join(",")} WHERE id=$${COLS.length + 1} RETURNING id`,
      [...COLS.map((k) => p[k]), params.id]);
    if (!r.rowCount) return false;
    await setImage(c, params.id, p.image);
    return true;
  });
  return ok ? { ok: true } : fail("Not found.", 404);
}, { write: true });

// Products referenced by orders must never be hard-deleted: DELETE deactivates (hides from the store).
export const DELETE = adminRoute(async ({ params }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad id.");
  const r = await query("UPDATE products SET is_active = FALSE WHERE id = $1", [params.id]);
  return r.rowCount ? { ok: true } : fail("Not found.", 404);
}, { write: true });
