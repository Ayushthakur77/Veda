import { NextResponse } from "next/server";
import { normalizePhone } from "../../../../lib/auth/phone";
import { checkOtp } from "../../../../lib/auth/otp";
import { createSession } from "../../../../lib/auth/session";
import { one } from "../../../../lib/db";
import { fail, readJson, noDb } from "../../../../lib/http";

export const dynamic = "force-dynamic";

const adminPhones = () => (process.env.ADMIN_PHONES || "").split(",").map((s) => normalizePhone(s.trim())).filter(Boolean);

export async function POST(req) {
  const nd = noDb(); if (nd) return nd;
  const body = await readJson(req);
  if (!body) return fail("Invalid request.", 415);
  const phone = normalizePhone(body.phone);
  if (!phone) return fail("Enter a valid 10-digit Indian mobile number.");
  const r = await checkOtp(phone, String(body.code ?? ""));
  if (!r.ok) return fail(r.error, 401);
  const isAdmin = adminPhones().includes(phone);
  const user = await one(
    `INSERT INTO users (phone, role) VALUES ($1, $2)
     ON CONFLICT (phone) DO UPDATE SET role = CASE WHEN $3 THEN 'admin' ELSE users.role END
     RETURNING id, phone, name, role`, [phone, isAdmin ? "admin" : "customer", isAdmin]);
  await createSession(user);
  return NextResponse.json({ ok: true, user: { phone: user.phone, name: user.name, role: user.role } });
}
