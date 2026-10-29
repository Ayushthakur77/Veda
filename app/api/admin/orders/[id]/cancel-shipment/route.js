import { adminRoute, Invalid, isUuid, str } from "../../../../../../lib/admin";
import { one, tx } from "../../../../../../lib/db";
import { providerFor } from "../../../../../../lib/couriers";

export const dynamic = "force-dynamic";

// Cancels a booked courier shipment (only before it is out for delivery); order returns to "packed" when no live shipment is left.
export const POST = adminRoute(async ({ params, body, admin }) => {
  if (!isUuid(params.id) || !isUuid(body.shipment_id)) throw new Invalid("Bad id.");
  const reason = str(body.reason, 200);
  if (!reason) throw new Invalid("Please give a reason.");
  const sh = await one(`SELECT id, provider, awb_code, status FROM shipments WHERE id=$1 AND order_id=$2`, [body.shipment_id, params.id]);
  if (!sh || !sh.awb_code) throw new Invalid("Shipment not found.");
  if (["delivered", "cancelled", "out_for_delivery"].includes(sh.status)) throw new Invalid(`A shipment that is ${sh.status.replace(/_/g, " ")} cannot be cancelled.`);
  const p = providerFor(sh.provider);
  if (!p || !p.enabled()) throw new Invalid("Courier is not configured.");
  let r;
  try { r = await p.cancel(sh.awb_code, reason); } catch (e) { throw new Invalid("Courier: " + e.message); }
  if (!r.cancelled) return { ok: true, queued: true, message: "Cancellation requested; the courier will confirm. Refresh tracking later." };
  await tx(async (c) => {
    await c.query(`UPDATE shipments SET status='cancelled' WHERE id=$1`, [sh.id]);
    const { rows: [live] } = await c.query(`SELECT count(*)::int AS n FROM shipments WHERE order_id=$1 AND provider IS NOT NULL AND status <> 'cancelled'`, [params.id]);
    const { rows: [o] } = await c.query(`SELECT status FROM orders WHERE id=$1 FOR UPDATE`, [params.id]);
    if (live.n === 0 && o.status === "shipped") {
      await c.query(`UPDATE orders SET status='packed' WHERE id=$1`, [params.id]);
      await c.query(`INSERT INTO order_status_history (order_id, status, note) VALUES ($1,'packed',$2)`, [params.id, `Courier shipment ${sh.awb_code} cancelled: ${reason}`]);
    }
    await c.query(`INSERT INTO audit_log (user_id, action, order_id, detail) VALUES ($1,'courier_cancel',$2,$3)`, [admin.id, params.id, `${sh.awb_code}: ${reason}`.slice(0, 300)]);
  });
  return { ok: true };
}, { write: true });
