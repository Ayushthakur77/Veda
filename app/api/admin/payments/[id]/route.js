import { adminRoute, Invalid, isUuid } from "../../../../../lib/admin";
import { tx } from "../../../../../lib/db";

// Marks a payment as refunded in our books (the actual money movement is done in the Razorpay dashboard until API refunds are wired in).
export const PATCH = adminRoute(async ({ params, body }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad id.");
  if (body.action !== "mark_refunded") throw new Invalid("Unknown action.");
  return tx(async (c) => {
    const { rows } = await c.query(`SELECT id, order_id, status FROM payments WHERE id=$1 FOR UPDATE`, [params.id]);
    const p = rows[0];
    if (!p) throw new Invalid("Payment not found.");
    if (!["captured", "paid"].includes(p.status)) throw new Invalid("Only received payments can be marked refunded.");
    await c.query(`UPDATE payments SET status='refunded' WHERE id=$1`, [params.id]);
    await c.query(`UPDATE orders SET payment_status='refunded' WHERE id=$1`, [p.order_id]);
    return { ok: true };
  });
}, { write: true });
