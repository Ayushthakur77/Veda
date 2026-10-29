import { one } from "./db";
// Master safety switch for REAL courier bookings (default OFF so test orders never reach the courier).
export async function liveBookingOn() {
  const r = await one(`SELECT value FROM app_settings WHERE key='courier_live'`);
  return r?.value === "on";
}

const digits = (s) => String(s || "").replace(/\D/g, "").slice(-10);
// Pickup address for Veda-owned products (marketplace sellers use their own premises): saved in admin, env as fallback.
export async function vedaPickupSetting() {
  const e = process.env;
  const row = await one(`SELECT value FROM app_settings WHERE key='veda_pickup'`);
  let s = {}; try { s = JSON.parse(row?.value || "{}"); } catch {}
  return {
    name: s.name || e.COMPANY_PICKUP_NAME || e.COMPANY_NAME || "", phone: digits(s.phone || e.COMPANY_PHONE || e.SUPPORT_PHONE),
    address: s.address || e.COMPANY_ADDRESS || "", city: s.city || e.COMPANY_CITY || "", state: s.state || e.COMPANY_STATE || "Delhi", pincode: s.pincode || e.COMPANY_PINCODE || "",
  };
}
