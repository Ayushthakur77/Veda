import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { one } from "../../../../lib/db";
import { applyEvents } from "../../../../lib/couriers/sync";

export const dynamic = "force-dynamic";

const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

// Shadowfax pushes a status event here. Configure the same secret in SHADOWFAX_WEBHOOK_KEY and in Shadowfax's callback settings.
export async function POST(req) {
  const key = process.env.SHADOWFAX_WEBHOOK_KEY;
  const got = (req.headers.get("authorization") || "").replace(/^Token\s+/i, "");
  if (!key || !got || !safeEq(got, key)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b || !b.awb_number || !b.status) return NextResponse.json({ error: "bad payload" }, { status: 400 });
  const sh = await one(`SELECT id FROM shipments WHERE provider='shadowfax' AND awb_code=$1`, [String(b.awb_number).slice(0, 60)]);
  if (!sh) return NextResponse.json({ ok: true, ignored: true }); // unknown AWB: acknowledge so the courier does not retry forever
  await applyEvents(sh.id, [{ status: b.status, text: b.status, location: b.current_location, remarks: b.comments, time: b.event_timestamp || new Date().toISOString() }]);
  return NextResponse.json({ ok: true });
}
