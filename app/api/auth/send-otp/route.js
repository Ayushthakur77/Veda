import { NextResponse } from "next/server";
import { normalizePhone } from "../../../../lib/auth/phone";
import { issueOtp } from "../../../../lib/auth/otp";
import { isMock } from "../../../../lib/auth/sms";
import { fail, readJson, noDb } from "../../../../lib/http";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const nd = noDb(); if (nd) return nd;
  const body = await readJson(req);
  if (!body) return fail("Invalid request.", 415);
  const phone = normalizePhone(body.phone);
  if (!phone) return fail("Enter a valid 10-digit Indian mobile number.");
  const r = await issueOtp(phone);
  if (!r.ok) return fail(r.error, r.status, r.retryAfter ? { retryAfter: r.retryAfter } : {});
  const showDev = isMock() && (process.env.NODE_ENV !== "production" || process.env.OTP_DEBUG_SHOW === "1");
  return NextResponse.json({ ok: true, phone, ...(showDev ? { devOtp: r.code } : {}) });
}
