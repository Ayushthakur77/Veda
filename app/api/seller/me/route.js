import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth/session";
import { hasDb } from "../../../../lib/db";
import { sellerOf } from "../../../../lib/seller";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasDb()) return NextResponse.json({ seller: null });
  const user = await getUser();
  if (!user) return NextResponse.json({ seller: null, loggedIn: false });
  const s = await sellerOf(user.id);
  return NextResponse.json({ loggedIn: true, seller: s && { business_name: s.business_name, seller_type: s.seller_type, status: s.status, admin_note: s.status === "approved" ? null : s.admin_note, commission_percent: Number(s.commission_percent) } });
}
