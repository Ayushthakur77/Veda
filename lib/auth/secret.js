export function authSecret() {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set (32+ characters) in production");
  }
  return "dev-only-secret-do-not-use-in-production-0123456789";
}
