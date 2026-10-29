import { one } from "./db";
// Master safety switch for REAL courier bookings (default OFF so test orders never reach the courier).
export async function liveBookingOn() {
  const r = await one(`SELECT value FROM app_settings WHERE key='courier_live'`);
  return r?.value === "on";
}
