import { adminRoute, Invalid, isUuid, optStr, num } from "../../../../../../lib/admin";
import { one } from "../../../../../../lib/db";

export const dynamic = "force-dynamic";

export const POST = adminRoute(async ({ params, body }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad seller id.");
  const amount = num(body.amount);
  if (!(amount > 0) || amount > 10_000_000) throw new Invalid("Enter a valid payout amount.");
  const s = await one(`SELECT id, commission_percent::float8 AS pct,
    (SELECT coalesce(sum(oi.unit_price*oi.quantity),0)::float8 FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.seller_id=$1 AND o.status='delivered') AS gross,
    (SELECT coalesce(sum(amount),0)::float8 FROM seller_payouts WHERE seller_id=$1) AS paid FROM sellers WHERE id=$1`, [params.id]);
  if (!s) throw new Invalid("Seller not found.");
  const balance = s.gross * (1 - s.pct / 100) - s.paid;
  if (amount > balance + 0.01) throw new Invalid(`Payout exceeds the balance (₹${balance.toFixed(2)}).`);
  await one(`INSERT INTO seller_payouts (seller_id, amount, reference, note) VALUES ($1,$2,$3,$4) RETURNING id`, [params.id, amount, optStr(body.reference, 80), optStr(body.note, 300)]);
  return { ok: true };
}, { write: true });
