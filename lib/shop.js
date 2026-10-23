import { NextResponse } from "next/server";
import { getUser } from "./auth/session";
import { hasDb } from "./db";
import { fail, readJson } from "./http";
import { Invalid } from "./admin";

// Wraps a customer route: DB present, logged-in user, JSON body for writes, friendly errors.
export function userRoute(handler, { write = false } = {}) {
  return async (req, ctx) => {
    if (!hasDb()) return fail("This feature is not available yet.", 503);
    const user = await getUser();
    if (!user) return fail("Please log in.", 401);
    let body = null;
    if (write && req.method !== "DELETE") { body = await readJson(req); if (!body) return fail("Invalid request body.", 415); }
    try {
      const out = await handler({ req, params: ctx?.params ?? {}, body, user });
      return out instanceof NextResponse ? out : NextResponse.json(out);
    } catch (e) {
      if (e.userMessage) return fail(e.userMessage, e.status || 400);
      console.error("[shop]", req.method, req.url, e);
      return fail("Something went wrong. Please try again.", 500);
    }
  };
}
export { Invalid };
