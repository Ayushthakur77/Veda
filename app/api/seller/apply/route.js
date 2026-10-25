import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth/session";
import { hasDb, one } from "../../../../lib/db";
import { fail, readJson } from "../../../../lib/http";
import { cleanApplication, sellerOf } from "../../../../lib/seller";

export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!hasDb()) return fail("Database is not configured.", 503);
  const user = await getUser();
  if (!user) return fail("Please log in first.", 401);
  const b = await readJson(req);
  if (!b) return fail("Invalid request body.", 415);
  if (await sellerOf(user.id)) return fail("You have already applied. Check your seller status.", 409);
  let a;
  try { a = cleanApplication(b); } catch (e) { if (e.userMessage) return fail(e.userMessage, 400); throw e; }
  const cols = Object.keys(a);
  await one(`INSERT INTO sellers (user_id, ${cols.join(",")}, agreement_accepted_at) VALUES ($1, ${cols.map((_, i) => "$" + (i + 2)).join(",")}, now()) RETURNING id`, [user.id, ...cols.map((k) => a[k])]);
  return NextResponse.json({ ok: true });
}
