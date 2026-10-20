import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { authSecret } from "./secret";
import { one } from "../db";

export const COOKIE = "veda_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const key = () => new TextEncoder().encode(authSecret());

export async function createSession(user) {
  const token = await new SignJWT({ uid: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
  cookies().set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE,
  });
}

export function destroySession() {
  cookies().set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

// Returns the current user row (fresh from DB, so role changes apply at once) or null.
export async function getUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.uid !== "string") return null;
    return await one("SELECT id, phone, name, email, language, role FROM users WHERE id = $1", [payload.uid]);
  } catch { return null; }
}

export async function requireAdmin() {
  const u = await getUser();
  return u && u.role === "admin" ? u : null;
}
