import { many, one, tx } from "../db";
import { providerFor } from "./index";

const ORDER_STEP = { out_for_delivery: "out_for_delivery", delivered: "delivered" };

// Stores courier tracking events for a shipment, updates shipment status, and advances the order when appropriate.
export async function applyEvents(shipmentId, events, trackingUrl = null) {
  const sh = await one(`SELECT id, order_id, provider, status FROM shipments WHERE id=$1`, [shipmentId]);
  if (!sh) return null;
  const p = providerFor(sh.provider);
  return tx(async (c) => {
    let latest = null;
    for (const e of events) {
      const when = e.time ? new Date(e.time) : null;
      if (!when || Number.isNaN(+when)) continue;
      await c.query(`INSERT INTO tracking_events (shipment_id, status, status_text, location, remarks, event_time) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
        [shipmentId, String(e.status).slice(0, 40), String(e.text || e.status).slice(0, 120), e.location ? String(e.location).slice(0, 160) : null, e.remarks || null, when]);
      if (!latest || when >= latest.when) latest = { when, e };
    }
    const sets = [`last_synced_at = now()`]; const args = [shipmentId];
    if (latest && sh.status !== "cancelled") {
      const mapped = p?.mapStatus(latest.e.status);
      args.push(String(latest.e.status).slice(0, 40)); sets.push(`courier_status = $${args.length}`);
      if (mapped) { args.push(mapped); sets.push(`status = $${args.length}`); }
      if (trackingUrl) { args.push(trackingUrl); sets.push(`tracking_url = COALESCE(tracking_url, $${args.length})`); }
      await c.query(`UPDATE shipments SET ${sets.join(", ")} WHERE id=$1`, args);
      // advance the order from the set of live shipments
      const { rows: all } = await c.query(`SELECT status FROM shipments WHERE order_id=$1 AND provider IS NOT NULL AND status <> 'cancelled'`, [sh.order_id]);
      const { rows: [o] } = await c.query(`SELECT status, payment_method, payment_status, total FROM orders WHERE id=$1 FOR UPDATE`, [sh.order_id]);
      let to = null;
      if (all.length && all.every((s) => s.status === "delivered") && ["shipped", "out_for_delivery"].includes(o.status)) to = "delivered";
      else if (all.some((s) => s.status === "out_for_delivery") && o.status === "shipped") to = "out_for_delivery";
      if (to) {
        await c.query(`UPDATE orders SET status=$2 WHERE id=$1`, [sh.order_id, to]);
        await c.query(`INSERT INTO order_status_history (order_id, status, note) VALUES ($1,$2,$3)`, [sh.order_id, to, `Courier update (${sh.provider})`]);
        if (to === "delivered" && o.payment_method === "cod" && o.payment_status !== "paid") {
          await c.query(`UPDATE orders SET payment_status='paid' WHERE id=$1`, [sh.order_id]);
          await c.query(`INSERT INTO payments (order_id, method, amount, status) VALUES ($1,'cod',$2,'captured')`, [sh.order_id, o.total]);
        }
      }
    } else await c.query(`UPDATE shipments SET ${sets.join(", ")} WHERE id=$1`, args);
    return { status: latest ? p?.mapStatus(latest.e.status) : null };
  });
}

// Pulls fresh tracking from the courier for one shipment.
export async function syncShipment(sh) {
  const p = providerFor(sh.provider);
  if (!p || !p.enabled() || !sh.awb_code) return null;
  const t = await p.track(sh.awb_code);
  return applyEvents(sh.id, t.events, t.trackingUrl);
}

// Only live, non-final shipments, and not more often than `minAgeSec` (limits courier API calls).
export async function syncOrder(orderId, minAgeSec = 0) {
  const list = await many(`SELECT id, provider, awb_code, status FROM shipments WHERE order_id=$1 AND provider IS NOT NULL AND awb_code IS NOT NULL AND status NOT IN ('delivered','cancelled')
    AND (last_synced_at IS NULL OR last_synced_at < now() - make_interval(secs => $2))`, [orderId, minAgeSec]);
  const out = [];
  for (const s of list) { try { await syncShipment(s); out.push({ id: s.id, ok: true }); } catch (e) { out.push({ id: s.id, ok: false, error: e.message }); } }
  return out;
}
