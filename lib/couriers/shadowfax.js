// Shadowfax forward-integration client. Endpoints/fields follow the "Shadowfax Unified API for Forward Integrations" docs
// (https://sfxunifiedapi.docs.apiary.io). Needs SHADOWFAX_TOKEN; SHADOWFAX_ENV=staging|production (default staging).
export const NAME = "shadowfax";
export const enabled = () => Boolean(process.env.SHADOWFAX_TOKEN);
export const envName = () => (process.env.SHADOWFAX_ENV === "production" ? "production" : "staging");
const base = () => process.env.SHADOWFAX_BASE_URL || (envName() === "production" ? "https://dale.shadowfax.in/api" : "https://dale.staging.shadowfax.in/api");

// Thrown when we cannot tell whether the courier created the shipment (timeout, network drop, 5xx).
export class Uncertain extends Error {}

async function call(path, { method = "GET", body } = {}) {
  let r;
  try {
    r = await fetch(base() + path, {
      method, headers: { Authorization: `Token ${process.env.SHADOWFAX_TOKEN}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(Number(process.env.SHADOWFAX_TIMEOUT_MS) || 20_000),
    });
  } catch { throw new Uncertain("Shadowfax did not respond in time."); }
  const j = await r.json().catch(() => ({}));
  return { status: r.status, json: j };
}

const errText = (e) => (!e ? "" : typeof e === "string" ? e : Array.isArray(e) ? e.join("; ") : Object.entries(e).map(([k, v]) => `${k}: ${errText(v)}`).join("; "));

// payload = documented marketplace order body. Returns { awb, reconciled? } or throws Error(userMessage) / Uncertain.
export async function createOrder(payload) {
  const { status, json: j } = await call("/v3/clients/orders/", { method: "POST", body: payload });
  if (status === 401) throw new Error("Shadowfax rejected the token (401). Check SHADOWFAX_TOKEN and SHADOWFAX_ENV.");
  if (status >= 500) throw new Uncertain("Shadowfax server error — booking status unknown.");
  if (j.message === "Success" && j.data?.awb_number) return { awb: String(j.data.awb_number), raw: j.data };
  const dup = j.AWB || /already created with AWB\s*:\s*(\S+)/i.exec(errText(j.errors))?.[1];
  if (dup) return { awb: String(dup), reconciled: true };
  throw new Error(j.message && j.message !== "Failure" ? j.message : errText(j.errors) || `Shadowfax error ${status}`);
}

export async function track(awb) {
  const { status, json: j } = await call(`/v4/clients/orders/${encodeURIComponent(awb)}/track/`);
  if (status === 401) throw new Error("Shadowfax rejected the token (401).");
  if (status !== 200) throw new Error(j.message || `Tracking failed (${status}).`);
  const od = j.order_details || {};
  const urlKey = Object.keys(od).find((k) => /track/i.test(k) && /url/i.test(k));
  return { trackingUrl: urlKey ? od[urlKey] : null, events: (j.tracking_details || []).map((e) => ({ status: String(e.status || ""), text: e.status || "", location: e.location || null, remarks: e.remarks || null, time: e.created })) };
}

export async function cancel(awb, remarks) {
  const { status, json: j } = await call("/v3/clients/orders/cancel/", { method: "POST", body: { request_id: awb, cancel_remarks: remarks } });
  if (status === 200) return { cancelled: true };
  if (status === 304) return { cancelled: false, queued: true };
  throw new Error(j.message || `Cancel failed (${status}).`);
}

// Courier status -> our shipment status. Unknown courier statuses return null (kept as raw text, internal status unchanged).
export function mapStatus(s) {
  const v = String(s || "").toLowerCase().replace(/[\s-]+/g, "_");
  if (v === "new") return "booked";
  if (["assigned_for_seller_pickup", "ofp", "out_for_pickup", "pickup_scheduled"].includes(v)) return "pickup_scheduled";
  if (["picked_up", "pickup_done", "recd_at_fwd_hub", "received_at_forward_hub"].includes(v)) return "picked_up";
  if (["bag_in_transit", "bag_received_at_via", "in_transit", "recd_at_rev_hub", "reached_destination_hub"].includes(v)) return "in_transit";
  if (["ofd", "out_for_delivery"].includes(v)) return "out_for_delivery";
  if (["delivered", "delivered_to_customer"].includes(v)) return "delivered";
  if (["ndr", "rts", "rto", "rts_d", "rto_d", "reopen_ndr", "lost", "damaged", "undelivered"].includes(v)) return "exception";
  if (v.startsWith("cancelled")) return "cancelled";
  return null;
}
