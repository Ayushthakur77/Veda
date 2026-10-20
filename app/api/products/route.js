import { NextResponse } from "next/server";
import { getProductsBySlugs } from "../../../lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const slugs = (new URL(req.url).searchParams.get("slugs") || "")
    .split(",").map((s) => s.trim()).filter((s) => /^[a-z0-9-]{1,200}$/.test(s)).slice(0, 50);
  return NextResponse.json({ products: await getProductsBySlugs(slugs) });
}
