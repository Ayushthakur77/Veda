import { adminRoute, Invalid, isUuid, optStr, num } from "../../../../../lib/admin";
import { REQUIRED_CHECKS } from "../../../../../lib/seller";
import { tx } from "../../../../../lib/db";

export const dynamic = "force-dynamic";
const CHECKS = ["identity", "licence", "premises", "pharmacist", "bank"];
const STATUSES = ["pending", "approved", "rejected", "suspended"];

// Admin verification: tick the document checks, set commission, then approve / reject / suspend.
export const PATCH = adminRoute(async ({ params, body }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad seller id.");
  return tx(async (c) => {
    const { rows: [s] } = await c.query(`SELECT * FROM sellers WHERE id=$1 FOR UPDATE`, [params.id]);
    if (!s) throw new Invalid("Seller not found.");
    const checks = { ...s.checks };
    if (body.checks && typeof body.checks === "object") for (const k of CHECKS) if (k in body.checks) checks[k] = body.checks[k] === true;
    const status = body.status ?? s.status;
    if (!STATUSES.includes(status)) throw new Invalid("Bad status.");
    const pct = body.commission_percent == null || body.commission_percent === "" ? Number(s.commission_percent) : num(body.commission_percent);
    if (!(pct >= 0 && pct <= 60)) throw new Invalid("Commission must be between 0 and 60%.");
    const note = body.admin_note !== undefined ? optStr(body.admin_note, 1000) : s.admin_note;
    if (status === "approved" && s.status !== "approved") {
      const missing = REQUIRED_CHECKS(s).filter((k) => !checks[k]);
      if (missing.length) throw new Invalid("Verify first: " + missing.join(", ") + ".");
      if (s.seller_type === "pharmacy" && s.licence_expiry && new Date(s.licence_expiry) <= new Date()) throw new Invalid("Drug licence has expired.");
    }
    if ((status === "rejected" || status === "suspended") && !note) throw new Invalid("Please write a reason in the note.");
    await c.query(`UPDATE sellers SET checks=$2::jsonb, status=$3::varchar, commission_percent=$4, admin_note=$5, approved_at = CASE WHEN $3::varchar='approved' AND approved_at IS NULL THEN now() ELSE approved_at END WHERE id=$1`,
      [params.id, checks, status, pct, note]);
    if (status === "suspended") await c.query(`UPDATE products SET is_active=false WHERE seller_id=$1`, [params.id]); // pull all listings immediately
    return { ok: true };
  });
}, { write: true });
