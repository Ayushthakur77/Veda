import { Invalid, isUuid } from "../../../../../lib/admin";
import { sellerRoute } from "../../../../../lib/seller";
import { cleanProduct, setImage, COLS } from "../../../../../lib/validators";
import { one, tx } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

// Seller may edit own listing or switch it off; only Veda can switch it on. Edits to a live listing send it back to review.
export const PATCH = sellerRoute(async ({ params, body, seller }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad product id.");
  const cur = await one(`SELECT id, is_active FROM products WHERE id=$1 AND seller_id=$2`, [params.id, seller.id]);
  if (!cur) throw new Invalid("Product not found.");
  if (Object.keys(body).length === 1 && body.is_active === false) {
    await one(`UPDATE products SET is_active=false WHERE id=$1 RETURNING id`, [params.id]);
    return { ok: true };
  }
  const p = cleanProduct({ ...body, supply_source: "distributor" });
  p.is_active = false;
  await tx(async (c) => {
    await c.query(`UPDATE products SET ${COLS.map((k, i) => `${k}=$${i + 1}`).join(",")} WHERE id=$${COLS.length + 1}`, [...COLS.map((k) => p[k]), params.id]);
    await setImage(c, params.id, p.image);
  });
  return { ok: true, review: cur.is_active };
}, { write: true });
