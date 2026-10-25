// Shiprocket integration (aggregator: Delhivery, Xpressbees, etc.).
// Needs: SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD (API user), SHIPROCKET_PICKUP_LOCATION (pickup nickname from the panel).
const BASE = "https://apiv2.shiprocket.in/v1/external";
let cached = { token: null, at: 0 };

export const shiprocketEnabled = () =>
  Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD && process.env.SHIPROCKET_PICKUP_LOCATION);

async function call(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = "Bearer " + (await token());
  const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15_000) });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && auth) { cached = { token: null, at: 0 }; }
  if (!r.ok) throw new Error(j.message || Object.values(j.errors || {}).flat().join("; ") || `Shiprocket error ${r.status}`);
  return j;
}

async function token() {
  if (cached.token && Date.now() - cached.at < 8 * 24 * 3600e3) return cached.token; // valid 10 days
  const j = await call("/auth/login", { method: "POST", auth: false, body: { email: process.env.SHIPROCKET_EMAIL, password: process.env.SHIPROCKET_PASSWORD } });
  if (!j.token) throw new Error("Shiprocket login failed.");
  cached = { token: j.token, at: Date.now() };
  return j.token;
}

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
const ist = (d) => new Date(d.getTime() + 5.5 * 3600e3).toISOString().slice(0, 16).replace("T", " ");

// Creates the Shiprocket order, assigns the cheapest/recommended courier (AWB) and requests pickup.
export async function createShipment({ order, items, customer }) {
  const a = order.address_snapshot;
  const prepaid = order.payment_status === "paid";
  const created = await call("/orders/create/adhoc", {
    method: "POST",
    body: {
      order_id: order.order_no,
      order_date: ist(new Date(order.created_at)),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,
      billing_customer_name: a.full_name,
      billing_last_name: "",
      billing_address: a.line1,
      billing_address_2: [a.line2, a.landmark].filter(Boolean).join(", "),
      billing_city: a.city,
      billing_pincode: a.pincode,
      billing_state: a.state,
      billing_country: "India",
      billing_email: customer.email || process.env.SHIPROCKET_FALLBACK_EMAIL || process.env.SHIPROCKET_EMAIL,
      billing_phone: String(a.phone || customer.phone || "").replace(/\D/g, "").slice(-10),
      shipping_is_billing: true,
      order_items: items.map((i) => ({ name: i.name_snapshot, sku: slug(i.name_snapshot), units: i.quantity, selling_price: i.unit_price })),
      payment_method: prepaid ? "Prepaid" : "COD",
      sub_total: Number(order.total_n ?? order.total),
      length: Number(process.env.PKG_LENGTH_CM || 15), breadth: Number(process.env.PKG_BREADTH_CM || 12),
      height: Number(process.env.PKG_HEIGHT_CM || 8), weight: Number(process.env.PKG_WEIGHT_KG || 0.5),
    },
  });
  const shipmentId = created.shipment_id;
  if (!shipmentId) throw new Error("Shiprocket did not return a shipment id.");
  const awb = await call("/courier/assign/awb", { method: "POST", body: { shipment_id: shipmentId } });
  const d = awb.response?.data;
  if (!d?.awb_code) throw new Error(awb.message || awb.response?.data?.awb_assign_error || "No courier available for this pincode / balance low in Shiprocket wallet.");
  await call("/courier/generate/pickup", { method: "POST", body: { shipment_id: [shipmentId] } }).catch(() => {}); // pickup can be scheduled later from the panel
  return {
    shiprocket_order_id: String(created.order_id), shipment_id: String(shipmentId),
    courier_name: d.courier_name, awb_code: String(d.awb_code),
    tracking_url: `https://shiprocket.co/tracking/${d.awb_code}`, shipping_cost: Number(d.freight_charges) || null,
  };
}
