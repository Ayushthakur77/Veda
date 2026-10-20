import { NextResponse } from "next/server";
import { hasDb } from "./db";

export const fail = (error, status = 400, extra = {}) => NextResponse.json({ error, ...extra }, { status });

// Parses a JSON body; rejects non-JSON content types (basic CSRF hardening alongside SameSite=Lax cookies).
export async function readJson(req) {
  if (!(req.headers.get("content-type") || "").includes("application/json")) return null;
  try { const b = await req.json(); return b && typeof b === "object" ? b : null; } catch { return null; }
}

export const noDb = () => (hasDb() ? null : fail("This feature is not available yet.", 503));
