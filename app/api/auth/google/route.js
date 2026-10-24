import { NextResponse } from "next/server";
import { verifyGoogleIdToken } from "../../../../lib/auth/google";
import { upsertGoogleUser } from "../../../../lib/auth/googleUser";
import { createSession } from "../../../../lib/auth/session";
import { fail, readJson, noDb } from "../../../../lib/http";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const nd = noDb(); if (nd) return nd;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return fail("Google sign-in is not available.", 503);
  const body = await readJson(req);
  if (!body) return fail("Invalid request.", 415);
  let g;
  try { g = await verifyGoogleIdToken(body.credential, clientId); }
  catch { return fail("Google sign-in failed. Please try again.", 401); }
  const user = await upsertGoogleUser(g);
  await createSession(user);
  return NextResponse.json({ ok: true, user: { phone: user.phone, name: user.name, role: user.role } });
}
