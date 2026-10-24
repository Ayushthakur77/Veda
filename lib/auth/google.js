import { createRemoteJWKSet, jwtVerify } from "jose";

let remote;
const googleKeys = () => (remote ??= createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs")));

// Verifies a Google Identity Services ID token. Returns { sub, email, name } or throws.
export async function verifyGoogleIdToken(idToken, clientId, keys = googleKeys()) {
  if (typeof idToken !== "string" || idToken.length > 4096) throw new Error("bad token");
  const { payload } = await jwtVerify(idToken, keys, { audience: clientId, issuer: ["https://accounts.google.com", "accounts.google.com"], algorithms: ["RS256"] });
  if (payload.email_verified !== true || typeof payload.email !== "string" || typeof payload.sub !== "string") throw new Error("email not verified");
  return { sub: payload.sub, email: payload.email.toLowerCase(), name: typeof payload.name === "string" ? payload.name.slice(0, 120) : null };
}

export const adminEmails = () => (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
