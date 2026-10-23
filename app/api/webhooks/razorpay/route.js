import { NextResponse } from "next/server";
import { hasDb } from "../../../../lib/db";
import { verifyWebhookSignature } from "../../../../lib/pay";
import { capturePayment, failPayment } from "../../../../lib/checkout";
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!hasDb()) return NextResponse.json({ error: "no db" }, { status: 503 });
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"))) return NextResponse.json({ error: "bad signature" }, { status: 400 });
  let ev; try { ev = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  const pay = ev?.payload?.payment?.entity;
  try {
    if (pay?.order_id && ev.event === "payment.captured") await capturePayment({ gatewayOrderId: pay.order_id, paymentId: pay.id, method: pay.method || null, amountPaise: pay.amount });
    else if (pay?.order_id && ev.event === "payment.failed") await failPayment(pay.order_id);
  } catch (e) { if (!e.userMessage) { console.error("[webhook]", e); return NextResponse.json({ error: "server" }, { status: 500 }); } }
  return NextResponse.json({ ok: true });
}
