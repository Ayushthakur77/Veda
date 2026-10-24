import { userRoute, Invalid } from "../../../../lib/shop";
import { createOrder, abandonOrder } from "../../../../lib/checkout";
import { createGatewayOrder, payMode } from "../../../../lib/pay";
import { query } from "../../../../lib/db";
export const dynamic = "force-dynamic";

export const POST = userRoute(async ({ body, user }) => {
  const mode = payMode();
  if (mode === "off") throw Object.assign(new Invalid("Online payments are not available yet."), { status: 503 });
  const order = await createOrder(user, body.items, String(body.address_id || ""));
  let gw;
  try { gw = await createGatewayOrder({ amountPaise: Math.round(order.total * 100), receipt: order.order_no }); }
  catch (e) { console.error("[checkout] gateway", e.message); await abandonOrder(order.id, "Payment gateway error"); throw Object.assign(new Invalid("Payment could not be started. Please try again."), { status: 502 }); }
  await query(`INSERT INTO payments (order_id, razorpay_order_id, amount, status) VALUES ($1,$2,$3,'created')`, [order.id, gw.id, order.total]);
  return { order_no: order.order_no, gateway_order_id: gw.id, amount: order.total, amountPaise: Math.round(order.total * 100), mode, keyId: mode === "razorpay" ? process.env.RAZORPAY_KEY_ID : null, phone: user.phone || null, name: user.name };
}, { write: true });
