import { one, many } from "../../../../lib/db";

// Earnings are counted only on DELIVERED orders (returns reverse them), minus Veda's commission.
export async function earnings(seller) {
  const r = await one(`SELECT coalesce(sum(oi.unit_price*oi.quantity),0)::float8 AS gross
    FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.seller_id=$1 AND o.status='delivered'`, [seller.id]);
  const paid = (await one(`SELECT coalesce(sum(amount),0)::float8 AS p FROM seller_payouts WHERE seller_id=$1`, [seller.id])).p;
  const pct = Number(seller.commission_percent);
  const commission = Math.round(r.gross * pct) / 100;
  const net = Math.round((r.gross - commission) * 100) / 100;
  return { gross: r.gross, commission, commission_percent: pct, net, paid, balance: Math.round((net - paid) * 100) / 100 };
}
export const payouts = (sid) => many(`SELECT amount::float8 AS amount, reference, note, created_at FROM seller_payouts WHERE seller_id=$1 ORDER BY created_at DESC LIMIT 100`, [sid]);
