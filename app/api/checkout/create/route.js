import { userRoute, Invalid } from "../../../../lib/shop";
import { createOrder, abandonOrder } from "../../../../lib/checkout";
import { createGatewayOrder, payMode, codConfig } from "../../../../lib/pay";
import { query } from "../../../../lib/db";
export const dynamic = "force-dynamic";

export const POST = userRoute(async ({ body, user }) => {
  if (body.payment_method === "cod") {
    if (!codConfig().enabled) throw new Invalid("Cash on Delivery is not available right now.");
    const o = await createOrder(user, body.items, String(body.address_id || ""), "cod");
    return { order_no: o.order_no, cod: true, amount: o.total };
  }
  const mode = payMode();
  const order = await createOrder(user, body.items, String(body.address_id || ""));
  if (mode === "off") return { order_no: order.order_no, mode, amount: order.total }; // no gateway: customer can still choose Cash on Delivery on the payment page
  let gw;
  try { gw = await createGatewayOrder({ amountPaise: Math.round(order.total * 100), receipt: order.order_no }); }
  catch (e) { console.error("[checkout] gateway", e.message); await abandonOrder(order.id, "Payment gateway error"); throw Object.assign(new Invalid("Payment could not be started. Please try again."), { status: 502 }); }
  await query(`INSERT INTO payments (order_id, razorpay_order_id, amount, status) VALUES ($1,$2,$3,'created')`, [order.id, gw.id, order.total]);
  return { order_no: order.order_no, gateway_order_id: gw.id, amount: order.total, amountPaise: Math.round(order.total * 100), mode, keyId: mode === "razorpay" ? process.env.RAZORPAY_KEY_ID : null, phone: user.phone || null, name: user.name };
}, { write: true });
