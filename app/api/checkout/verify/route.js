import { userRoute, Invalid } from "../../../../lib/shop";
import { capturePayment } from "../../../../lib/checkout";
import { verifyPaymentSignature, payMode } from "../../../../lib/pay";
export const dynamic = "force-dynamic";
export const POST = userRoute(async ({ body, user }) => {
  if (payMode() !== "razorpay") throw new Invalid("Not available.");
  const orderId = String(body.razorpay_order_id || ""), paymentId = String(body.razorpay_payment_id || "");
  if (!verifyPaymentSignature({ orderId, paymentId, signature: String(body.razorpay_signature || "") })) throw new Invalid("Payment could not be verified. If money was deducted, it will be refunded automatically or contact us.");
  return capturePayment({ gatewayOrderId: orderId, paymentId, userId: user.id });
}, { write: true });
