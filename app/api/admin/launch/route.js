import { adminRoute, Invalid, optStr } from "../../../../lib/admin";
import { many, one } from "../../../../lib/db";

export const dynamic = "force-dynamic";
const LAUNCH_KEYS = ["dcd_email", "docs_verified", "gateway_approval", "seller_agreement", "site_compliance", "launch_clearance", "first_order_test"];

export const GET = adminRoute(async () => ({ items: await many(`SELECT key, done, note, updated_at FROM launch_checklist`) }));

export const PUT = adminRoute(async ({ body }) => {
  if (!LAUNCH_KEYS.includes(body.key)) throw new Invalid("Unknown checklist item.");
  await one(`INSERT INTO launch_checklist (key, done, note) VALUES ($1,$2,$3)
    ON CONFLICT (key) DO UPDATE SET done=EXCLUDED.done, note=EXCLUDED.note, updated_at=now() RETURNING key`, [body.key, body.done === true, optStr(body.note, 500)]);
  return { ok: true };
}, { write: true });
