import { NextResponse } from "next/server";
import { payMode, shippingConfig, codConfig } from "../../../../lib/pay";
export const dynamic = "force-dynamic";
export async function GET() {
  const mode = payMode();
  return NextResponse.json({ mode, keyId: mode === "razorpay" ? process.env.RAZORPAY_KEY_ID : null, ...shippingConfig(), cod: codConfig() });
}
