import { adminRoute, Invalid, isUuid } from "../../../../../../lib/admin";
import { syncOrder } from "../../../../../../lib/couriers/sync";

export const dynamic = "force-dynamic";

export const POST = adminRoute(async ({ params }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad order id.");
  const res = await syncOrder(params.id, 0);
  const bad = res.find((x) => !x.ok);
  if (bad) throw new Invalid("Tracking refresh failed: " + bad.error);
  return { ok: true, refreshed: res.length };
}, { write: true });
