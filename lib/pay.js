import crypto from "node:crypto";

const isProd = () => process.env.NODE_ENV === "production";

// 'razorpay' (live/test keys set) | 'mock' (local testing only) | 'off' (production without keys: checkout disabled)
export function payMode() {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) return "razorpay";
  if (!isProd() || process.env.PAYMENT_MOCK === "1") return "mock";
  return "off";
}

export const codConfig = () => ({ enabled: process.env.COD_ENABLED !== "0", max: Number(process.env.COD_MAX_ORDER ?? 5000) });

export const shippingConfig = () => ({
  fee: Number(process.env.SHIPPING_FEE ?? 49),
  freeAbove: Number(process.env.FREE_SHIPPING_ABOVE ?? 499),
});

const hmac = (secret, data) => crypto.createHmac("sha256", secret).update(data).digest("hex");
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

export async function createGatewayOrder({ amountPaise, receipt }) {
  if (payMode() === "mock") return { id: "order_mock_" + crypto.randomBytes(8).toString("hex") };
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const r = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt }), signal: AbortSignal.timeout(10_000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.id) throw new Error("Razorpay order failed: " + (j.error?.description || r.status));
  return j;
}

export const verifyPaymentSignature = ({ orderId, paymentId, signature }) =>
  Boolean(signature) && safeEq(hmac(process.env.RAZORPAY_KEY_SECRET || "", `${orderId}|${paymentId}`), signature);

export const verifyWebhookSignature = (rawBody, signature) =>
  Boolean(process.env.RAZORPAY_WEBHOOK_SECRET && signature) && safeEq(hmac(process.env.RAZORPAY_WEBHOOK_SECRET, rawBody), signature);
