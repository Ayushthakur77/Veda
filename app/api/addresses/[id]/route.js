import { userRoute, Invalid } from "../../../../lib/shop";
import { query } from "../../../../lib/db";
import { isUuid } from "../../../../lib/admin";
export const DELETE = userRoute(async ({ params, user }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad id.");
  await query(`DELETE FROM addresses WHERE id=$1 AND user_id=$2`, [params.id, user.id]);
  return { ok: true };
});
