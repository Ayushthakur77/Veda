import { one } from "../db";
import { adminEmails } from "./google";

// Finds or creates the user for a verified Google identity. Accounts are linked by Google's stable `sub` only
// (never by e-mail text, which users can type into any profile).
export async function upsertGoogleUser({ sub, email, name }) {
  const isAdmin = adminEmails().includes(email);
  return one(
    `INSERT INTO users (google_sub, email, name, role) VALUES ($1, $2, $3, $4)
     ON CONFLICT (google_sub) WHERE google_sub IS NOT NULL
     DO UPDATE SET role = CASE WHEN $5 THEN 'admin' ELSE users.role END, name = coalesce(users.name, EXCLUDED.name), email = coalesce(users.email, EXCLUDED.email)
     RETURNING id, phone, name, email, role`, [sub, email, name, isAdmin ? "admin" : "customer", isAdmin]);
}
