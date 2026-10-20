import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth/session";
import { hasDb } from "../../../../lib/db";
import { fail, readJson } from "../../../../lib/http";
import { query } from "../../../../lib/db";

export const dynamic = "force-dynamic";

const pub = (u) => ({ phone: u.phone, name: u.name, email: u.email, language: u.language, role: u.role });

export async function GET() {
  if (!hasDb()) return NextResponse.json({ user: null, enabled: false });
  const u = await getUser();
  return NextResponse.json({ user: u ? pub(u) : null, enabled: true });
}

export async function PATCH(req) {
  const u = await getUser();
  if (!u) return fail("Please log in.", 401);
  const b = await readJson(req);
  if (!b) return fail("Invalid request.", 415);
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 120) : u.name;
  const email = typeof b.email === "string" ? b.email.trim().slice(0, 160) : u.email;
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Enter a valid email.");
  const language = b.language === "hi" || b.language === "en" ? b.language : u.language;
  await query("UPDATE users SET name = $1, email = $2, language = $3 WHERE id = $4", [name || null, email || null, language, u.id]);
  return NextResponse.json({ ok: true });
}
