import { adminRoute, Invalid, isUuid, optStr } from "../../../../../lib/admin";
import { one } from "../../../../../lib/db";
import { ISSUE_STATUSES } from "../../../../../lib/orders";

export const PATCH = adminRoute(async ({ params, body }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad id.");
  if (!ISSUE_STATUSES.includes(body.status)) throw new Invalid("Unknown status.");
  const r = await one(`UPDATE support_issues SET status=$2, admin_note=coalesce($3, admin_note), updated_at=now() WHERE id=$1 RETURNING id`,
    [params.id, body.status, optStr(body.admin_note, 400)]);
  if (!r) throw new Invalid("Issue not found.");
  return { ok: true };
}, { write: true });
