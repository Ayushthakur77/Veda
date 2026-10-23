import { userRoute, Invalid } from "../../../../lib/shop";
import { capturePayment } from "../../../../lib/checkout";
import { payMode } from "../../../../lib/pay";
export const dynamic = "force-dynamic";
// Test-mode only (no Razorpay keys, non-production or PAYMENT_MOCK=1): pretends the payment succeeded.
export const POST = userRoute(async ({ body, user }) => {
  if (payMode() !== "mock") throw new Invalid("Not available.");
  return capturePayment({ gatewayOrderId: String(body.gateway_order_id || ""), paymentId: "pay_mock_" + Date.now(), method: "mock", userId: user.id });
}, { write: true });
