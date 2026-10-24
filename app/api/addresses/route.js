import { userRoute, Invalid } from "../../../lib/shop";
import { many, one, tx } from "../../../lib/db";
import { str, optStr } from "../../../lib/admin";
import { isServiceable } from "../../../lib/pincode";
import { normalizePhone } from "../../../lib/auth/phone";
export const dynamic = "force-dynamic";

export const GET = userRoute(async ({ user }) => ({
  rows: await many(`SELECT id, full_name, phone, line1, line2, landmark, city, state, pincode, is_default FROM addresses WHERE user_id=$1 ORDER BY is_default DESC, id DESC`, [user.id]),
}));

export const POST = userRoute(async ({ body, user }) => {
  const a = { full_name: str(body.full_name, 120), line1: str(body.line1, 300), line2: optStr(body.line2, 300), landmark: optStr(body.landmark, 200), city: str(body.city, 80), state: str(body.state, 80) || "Delhi", pincode: str(body.pincode, 6) };
  const phone = normalizePhone(String(body.phone || user.phone || ""));
  if (!a.full_name || !a.line1 || !a.city) throw new Invalid("Name, address and city are required.");
  if (!phone) throw new Invalid("Enter a valid 10-digit mobile number.");
  if (!/^\d{6}$/.test(a.pincode)) throw new Invalid("Enter a valid 6-digit pincode.");
  if (!isServiceable(a.pincode)) throw new Invalid("Sorry, we currently deliver only in Delhi NCR.");
  const n = (await one(`SELECT count(*)::int AS n FROM addresses WHERE user_id=$1`, [user.id])).n;
  if (n >= 10) throw new Invalid("You can save up to 10 addresses. Please delete one first.");
  return tx(async (c) => {
    if (n === 0 || body.is_default) await c.query(`UPDATE addresses SET is_default=FALSE WHERE user_id=$1`, [user.id]);
    const { rows: [r] } = await c.query(
      `INSERT INTO addresses (user_id, full_name, phone, line1, line2, landmark, city, state, pincode, is_default) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [user.id, a.full_name, phone, a.line1, a.line2, a.landmark, a.city, a.state, a.pincode, n === 0 || Boolean(body.is_default)]);
    return { id: r.id };
  });
}, { write: true });
