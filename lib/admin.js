import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./auth/session";
import { hasDb } from "./db";
import { fail, readJson } from "./http";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s) => typeof s === "string" && UUID.test(s);
export const isIntId = (s) => /^\d{1,9}$/.test(String(s));

// Wraps an admin route: DB present, admin session, JSON body for writes, friendly DB errors.
export function adminRoute(handler, { write = false } = {}) {
  return async (req, ctx) => {
    if (!hasDb()) return fail("Database is not configured.", 503);
    const admin = await requireAdmin();
    if (!admin) return fail("Forbidden", 403);
    let body = null;
    if (write && req.method !== "DELETE") {
      body = await readJson(req);
      if (!body) return fail("Invalid request body.", 415);
    }
    try {
      const out = await handler({ req, params: ctx?.params ?? {}, body, admin });
      if (write) revalidatePath("/", "layout");
      return out instanceof NextResponse ? out : NextResponse.json(out);
    } catch (e) {
      if (e.code === "23505") return fail("That value already exists (duplicate SKU, slug, code or batch).", 409);
      if (e.code === "23503") return fail("Referenced record does not exist or is still in use.", 409);
      if (e.code === "23514") return fail("A value is out of the allowed range.", 400);
      if (e.userMessage) return fail(e.userMessage, 400);
      console.error("[admin]", req.method, req.url, e);
      return fail("Server error.", 500);
    }
  };
}

export class Invalid extends Error { constructor(m) { super(m); this.userMessage = m; } }

export const slugify = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
export const str = (v, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const optStr = (v, max = 500) => str(v, max) || null;
export const num = (v) => (v === "" || v == null ? NaN : Number(v));
export const int = (v) => { const n = num(v); return Number.isInteger(n) ? n : NaN; };
