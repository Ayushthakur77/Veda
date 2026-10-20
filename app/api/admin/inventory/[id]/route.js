import { adminRoute, Invalid, isUuid, int } from "../../../../../lib/admin";
import { query } from "../../../../../lib/db";
import { fail } from "../../../../../lib/http";

export const dynamic = "force-dynamic";

// Stock correction: set the available quantity of one batch (damage, recount, manual sale).
export const PATCH = adminRoute(async ({ params, body }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad id.");
  const q = int(body.qty_available);
  if (!(q >= 0) || q > 1_000_000) throw new Invalid("Quantity must be 0 or more.");
  const r = await query("UPDATE inventory_batches SET qty_available = $1 WHERE id = $2", [q, params.id]);
  return r.rowCount ? { ok: true } : fail("Not found.", 404);
}, { write: true });
