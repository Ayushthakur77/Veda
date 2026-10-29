import { adminRoute, Invalid } from "../../../../lib/admin";
import { one } from "../../../../lib/db";
import { liveBookingOn, vedaPickupSetting } from "../../../../lib/livebooking";
import { envName } from "../../../../lib/couriers/shadowfax";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async () => ({ live: await liveBookingOn(), env: envName(), pickup: await vedaPickupSetting() }));

const up = (key, value, uid) => one(`INSERT INTO app_settings (key,value,updated_by,updated_at) VALUES ($1,$2,$3,now()) ON CONFLICT (key) DO UPDATE SET value=$2, updated_by=$3, updated_at=now() RETURNING key`, [key, value, uid]);

export const PATCH = adminRoute(async ({ body, admin }) => {
  if (body.pickup) {
    const p = body.pickup, t = (v, n) => String(v || "").trim().slice(0, n);
    const clean = { name: t(p.name, 100), phone: String(p.phone || "").replace(/\D/g, "").slice(-10), address: t(p.address, 250), city: t(p.city, 60), state: t(p.state, 40) || "Delhi", pincode: String(p.pincode || "").replace(/\D/g, "") };
    if (!clean.name || !clean.address || !clean.city) throw new Invalid("Name, address and city are required.");
    if (clean.phone.length !== 10) throw new Invalid("Enter a 10-digit pickup phone number.");
    if (clean.pincode.length !== 6) throw new Invalid("Enter a 6-digit pincode.");
    await up("veda_pickup", JSON.stringify(clean), admin.id);
    await one(`INSERT INTO audit_log (user_id, action, detail) VALUES ($1,'courier_pickup',$2) RETURNING id`, [admin.id, `${clean.name}, ${clean.city} ${clean.pincode}`]);
    return { pickup: await vedaPickupSetting() };
  }
  if (typeof body.live !== "boolean") throw new Invalid("live must be true or false.");
  await up("courier_live", body.live ? "on" : "off", admin.id);
  await one(`INSERT INTO audit_log (user_id, action, detail) VALUES ($1,'courier_live',$2) RETURNING id`, [admin.id, body.live ? "on" : "off"]);
  return { live: body.live, env: envName() };
}, { write: true });
