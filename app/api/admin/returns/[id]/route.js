import { adminRoute, Invalid, isUuid, num, optStr, str } from "../../../../../lib/admin";
import { tx } from "../../../../../lib/db";
import { RETURN_STATUSES } from "../../../../../lib/orders";

export const PATCH = adminRoute(async ({ params, body }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad id.");
  const status = str(body.status, 15);
  if (!RETURN_STATUSES.includes(status)) throw new Invalid("Unknown status.");
  return tx(async (c) => {
    const { rows } = await c.query(`SELECT r.id, r.order_id, o.total FROM order_returns r JOIN orders o ON o.id=r.order_id WHERE r.id=$1 FOR UPDATE OF r`, [params.id]);
    const r = rows[0];
    if (!r) throw new Invalid("Return not found.");
    let refund = null;
    if (status === "refunded") {
      refund = body.refund_amount === undefined || body.refund_amount === "" ? Number(r.total) : num(body.refund_amount);
      if (!Number.isFinite(refund) || refund < 0 || refund > Number(r.total)) throw new Invalid("Refund must be between 0 and the order total.");
    }
    await c.query(`UPDATE order_returns SET status=$2, refund_amount=coalesce($3, refund_amount), admin_note=coalesce($4, admin_note), updated_at=now() WHERE id=$1`,
      [params.id, status, refund, optStr(body.admin_note, 400)]);
    if (status === "refunded") {
      await c.query(`UPDATE orders SET payment_status='refunded', status='returned' WHERE id=$1 AND status='delivered'`, [r.order_id]);
      await c.query(`INSERT INTO order_status_history (order_id, status, note) SELECT $1,'returned','Return refunded' WHERE EXISTS (SELECT 1 FROM orders WHERE id=$1 AND status='returned')`, [r.order_id]);
    }
    return { ok: true };
  });
}, { write: true });
