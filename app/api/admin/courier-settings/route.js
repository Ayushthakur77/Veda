import { adminRoute, Invalid } from "../../../../lib/admin";
import { one } from "../../../../lib/db";
import { liveBookingOn } from "../../../../lib/livebooking";
import { envName } from "../../../../lib/couriers/shadowfax";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async () => ({ live: await liveBookingOn(), env: envName() }));

export const PATCH = adminRoute(async ({ body, admin }) => {
  if (typeof body.live !== "boolean") throw new Invalid("live must be true or false.");
  await one(`INSERT INTO app_settings (key,value,updated_by,updated_at) VALUES ('courier_live',$1,$2,now()) ON CONFLICT (key) DO UPDATE SET value=$1, updated_by=$2, updated_at=now() RETURNING key`, [body.live ? "on" : "off", admin.id]);
  await one(`INSERT INTO audit_log (user_id, action, detail) VALUES ($1,'courier_live',$2) RETURNING id`, [admin.id, body.live ? "on" : "off"]);
  return { live: body.live, env: envName() };
}, { write: true });
