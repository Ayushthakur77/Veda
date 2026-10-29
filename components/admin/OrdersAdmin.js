"use client";
import { useState } from "react";
import { api, useLoad, inrA, fmtDate, Status, Empty, Field } from "./api";

const TABS = {
  hub: { title: "Hub Orders", filters: [["", "All"], ["placed", "New"], ["confirmed", "Confirmed"], ["packed", "Packed"], ["shipped,out_for_delivery", "In transit"], ["delivered", "Delivered"]] },
  track: { title: "Track Orders", filters: [["shipped,out_for_delivery", "In transit"], ["shipped", "Shipped"], ["out_for_delivery", "Out for delivery"], ["delivered", "Delivered"]] },
  cancelled: { title: "Cancellations", filters: [["cancelled", "Cancelled"]] },
};


function VedaPickup() {
  const { data, reload } = useLoad("/api/admin/courier-settings");
  const [f, setF] = useState(null); const [m, setM] = useState(""); const [open, setOpen] = useState(false);
  const cur = f || data?.pickup || {};
  const set = (k) => (e) => setF({ ...cur, [k]: e.target.value });
  const save = async () => { setM(""); try { await api("/api/admin/courier-settings", "PATCH", { pickup: cur }); setF(null); await reload(); setM("Saved."); } catch (e) { setM(e.message); } };
  const ok = cur.name && cur.address && cur.pincode;
  return (
    <div style={{ marginTop: 10 }}>
      <button type="button" className="link-btn" onClick={() => setOpen(!open)}>{open ? "▾" : "▸"} Veda pickup address (for Veda's own products){ok ? "" : " — not set"}</button>
      {open && <div className="grid2" style={{ marginTop: 8 }}>
        <Field label="Name / business"><input value={cur.name || ""} onChange={set("name")} /></Field>
        <Field label="Pickup phone (10 digits)"><input value={cur.phone || ""} onChange={set("phone")} /></Field>
        <Field label="Address" wide><input value={cur.address || ""} onChange={set("address")} /></Field>
        <Field label="City"><input value={cur.city || ""} onChange={set("city")} /></Field>
        <Field label="Pincode"><input value={cur.pincode || ""} onChange={set("pincode")} /></Field>
        <div><button type="button" className="btn" onClick={save}>Save pickup address</button> {m && <small>{m}</small>}</div>
        <p className="muted" style={{ gridColumn: "1 / -1", margin: 0 }}>Products sold by a marketplace seller are picked up from that seller's own address automatically.</p>
      </div>}
    </div>
  );
}

export default function OrdersAdmin({ mode = "hub" }) {
  const cfg = TABS[mode];
  const [st, setSt] = useState(cfg.filters[0][0]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const { data, err, reload } = useLoad(`/api/admin/orders?status=${st}&q=${encodeURIComponent(q)}&page=${page}`);
  const [open, setOpen] = useState(null);
  return (
    <div>
      <div className="bar"><h1>{cfg.title}</h1></div>
      <div className="filters" style={{ margin: "8px 0" }}>
        {cfg.filters.map(([v, l]) => (
          <button key={v} className={"pill-b" + (st === v ? " on" : "")} onClick={() => { setSt(v); setPage(0); }}>
            {l}{data && v && !v.includes(",") && data.counts[v] != null ? ` (${data.counts[v]})` : ""}
          </button>
        ))}
      </div>
      <input className="adm-search" placeholder="Search order no, name or phone" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
      {err && <p className="bad">{err}</p>}
      {data && data.rows.length === 0 && <Empty>No orders here yet. Orders appear once customers can check out.</Empty>}
      {data && data.rows.length > 0 && (
        <table className="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Status</th>{mode === "track" ? <th>Courier / AWB</th> : <th>Payment</th>}<th className="r">Total</th></tr></thead>
          <tbody>{data.rows.map((o) => (
            <tr key={o.id} className="click" onClick={() => setOpen(o.id)}>
              <td><b>{o.order_no}</b><div className="muted">{fmtDate(o.created_at)} · {o.items} item(s)</div></td>
              <td>{o.name || "—"}<div className="muted">{o.phone}{o.city ? ` · ${o.city} ${o.pincode || ""}` : ""}</div></td>
              <td><Status s={o.status} />{o.cancel_reason && <div className="muted">{o.cancel_reason}</div>}</td>
              {mode === "track"
                ? <td>{o.courier_name || "—"}<div className="muted">{o.tracking_url ? <a href={o.tracking_url} target="_blank" rel="noreferrer noopener" className="link-btn">{o.awb_code}</a> : o.awb_code}</div></td>
                : <td><Status s={o.payment_method === "cod" && o.payment_status !== "paid" ? "COD" : o.payment_status} /></td>}
              <td className="r">{inrA(o.total)}</td>
            </tr>))}</tbody></table>
      )}
      {data && data.total > data.pageSize && (
        <div className="row" style={{ justifyContent: "center", marginTop: 12 }}>
          <button className="btn ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="muted">Page {page + 1} of {Math.ceil(data.total / data.pageSize)}</span>
          <button className="btn ghost" disabled={(page + 1) * data.pageSize >= data.total} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
      {open && <OrderDrawer id={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </div>
  );
}

function OrderDrawer({ id, onClose, onChanged }) {
  const { data, err, reload } = useLoad(`/api/admin/orders/${id}`);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");
  const move = async (to) => {
    setMsg("");
    try { await api(`/api/admin/orders/${id}`, "PATCH", { status: to, ...form }); setForm({}); await reload(); onChanged(); } catch (e) { setMsg(e.message); }
  };
  const [busy, setBusy] = useState(false);
  const toggleLive = async () => {
    const turnOn = !data.live_booking;
    if (turnOn && !window.confirm(`Turn ON live courier booking (${data.courier_env || "staging"})?\n\nAfter this, "Book" creates REAL Shadowfax pickups. Keep it OFF while testing.`)) return;
    setMsg(""); setBusy(true); try { await api("/api/admin/courier-settings", "PATCH", { live: turnOn }); await reload(); } catch (e) { setMsg(e.message); } setBusy(false);
  };
  const bookCourier = async () => {
    const a = data.order.address_snapshot || {};
    if (!window.confirm(`Book a REAL Shadowfax pickup for ${data.order.order_no}?\n\nDeliver to: ${a.full_name || ""}, ${a.line1 || ""}, ${a.city || ""} ${a.pincode || ""}\nPayment: ${data.order.payment_method === "cod" ? "COD ₹" + data.order.total : "Prepaid"}\n\nThe pickup is taken from the seller's address. Do not book test orders.`)) return;
    setMsg(""); setBusy(true); try { await api(`/api/admin/orders/${id}/book`, "POST", { provider: "shadowfax" }); await reload(); onChanged(); } catch (e) { setMsg(e.message); await reload(); } setBusy(false);
  };
  const refreshTrack = async () => { setMsg(""); setBusy(true); try { await api(`/api/admin/orders/${id}/track`, "POST", {}); await reload(); onChanged(); } catch (e) { setMsg(e.message); } setBusy(false); };
  const cancelShipment = async (sid) => { const reason = prompt("Reason for cancelling this courier shipment:"); if (!reason) return; setBusy(true); try { const r = await api(`/api/admin/orders/${id}/cancel-shipment`, "POST", { shipment_id: sid, reason }); if (r.message) alert(r.message); await reload(); onChanged(); } catch (e) { setMsg(e.message); } setBusy(false); };
  const autoShip = async () => {
    setMsg(""); setBusy(true);
    try { await api(`/api/admin/orders/${id}/ship`, "POST", {}); await reload(); onChanged(); } catch (e) { setMsg(e.message); }
    setBusy(false);
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const o = data?.order;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="bar"><h2 style={{ margin: 0 }}>{o ? o.order_no : "Order"}</h2><button className="link-btn" onClick={onClose}>Close ✕</button></div>
        {err && <p className="bad">{err}</p>}
        {!data && !err && <p>Loading…</p>}
        {o && <>
          <p><Status s={o.status} /> <Status s={o.payment_method === "cod" && o.payment_status !== "paid" ? "COD" : o.payment_status} /> <span className="muted">{fmtDate(o.created_at)}</span></p>
          <p><b>{o.name || "Customer"}</b> · {o.phone}</p>
          <p className="muted">{[o.address_snapshot?.full_name, o.address_snapshot?.line1, o.address_snapshot?.line2, o.address_snapshot?.landmark, o.address_snapshot?.city, o.address_snapshot?.pincode].filter(Boolean).join(", ")}</p>
          <table className="tbl"><tbody>
            {data.items.map((i, n) => <tr key={n}><td>{i.name_snapshot}</td><td className="r">{i.quantity} × {inrA(i.unit_price)}</td></tr>)}
            <tr><td className="muted">Discount / Shipping / GST</td><td className="r muted">−{inrA(o.discount)} / {inrA(o.shipping_fee)} / {inrA(o.gst_amount)}</td></tr>
            <tr><td><b>Total</b></td><td className="r"><b>{inrA(o.total_n)}</b></td></tr>
          </tbody></table>
          {o.status !== "cancelled" && <p><a className="btn ghost" href={`/invoice/${o.order_no}`} target="_blank" rel="noreferrer">Download / print invoice</a></p>}
          {(data.shipments || []).length > 0 && <div className="box" style={{ marginBottom: 8 }}>
            <h3 style={{ fontSize: 15, marginBottom: 6 }}>Courier shipments</h3>
            {data.shipments.map((s) => <div key={s.id} style={{ padding: "4px 0" }}>
              <b>{s.courier_name}</b> · {s.tracking_url ? <a className="link-btn" href={s.tracking_url} target="_blank" rel="noreferrer">{s.awb_code}</a> : s.awb_code} <Status s={s.status} /> {s.courier_status && <span className="muted">({s.courier_status})</span>}
              {s.seller && <div className="muted">Pickup: {s.seller}</div>}
              {!["delivered", "cancelled", "out_for_delivery"].includes(s.status) && <button className="link-btn" disabled={busy} onClick={() => cancelShipment(s.id)}>Cancel shipment</button>}
            </div>)}
            <button className="btn ghost" disabled={busy} onClick={refreshTrack}>Refresh tracking</button>
            <p className="muted" style={{ marginTop: 6 }}>Shipping label: not available through the Shadowfax API — download it from your Shadowfax dashboard using the AWB above.</p>
          </div>}
          {(data.attempts || []).some((a) => a.state !== "success") && <p className="muted">Last booking attempt: {data.attempts[0].state}{data.attempts[0].error ? ` — ${data.attempts[0].error}` : ""}</p>}
          {data.shipment && <p className="muted">Shipment: {data.shipment.courier_name} · {data.shipment.awb_code}</p>}
          <h3 style={{ fontSize: 15, margin: "14px 0 6px" }}>History</h3>
          {data.history.map((h, n) => <div key={n} className="muted">{fmtDate(h.created_at)} — <b>{h.status.replace(/_/g, " ")}</b>{h.note ? ` · ${h.note}` : ""}</div>)}
          {data.next.length > 0 && (
            <div className="box" style={{ marginBottom: 0 }}>
              <h3 style={{ fontSize: 15, marginBottom: 8 }}>Update status</h3>
              {data.next.includes("shipped") && <div className="grid2">
                <Field label="Courier"><input value={form.courier_name || ""} onChange={set("courier_name")} placeholder="Delhivery" /></Field>
                <Field label="AWB / tracking no."><input value={form.awb_code || ""} onChange={set("awb_code")} /></Field>
                <Field label="Tracking link (optional)" wide><input value={form.tracking_url || ""} onChange={set("tracking_url")} /></Field>
              </div>}
              {data.next.includes("cancelled") && <Field label="Cancellation reason (needed to cancel)"><input value={form.cancel_reason || ""} onChange={set("cancel_reason")} /></Field>}
              <Field label="Note (optional)"><input value={form.note || ""} onChange={set("note")} /></Field>
              {data.next.includes("shipped") && (data.couriers || []).includes("shadowfax") && <VedaPickup />}
              {msg && <p className="bad">{msg}</p>}
              <div className="row" style={{ justifyContent: "flex-start", marginTop: 10, flexWrap: "wrap" }}>
                {data.next.includes("shipped") && (data.couriers || []).includes("shadowfax") && <>
                  <button className={"btn " + (data.live_booking ? "danger" : "ghost")} disabled={busy} onClick={toggleLive} title="Master switch for real courier bookings">Live booking: {data.live_booking ? "ON (" + (data.courier_env || "") + ")" : "OFF"}</button>
                  <button className="btn" disabled={busy || !data.live_booking} onClick={bookCourier} title={data.live_booking ? "" : "Turn Live booking ON first"}>{busy ? "Working…" : "Book Shadowfax (real pickup)"}</button>
                </>}
                {data.next.includes("shipped") && <button className="btn ghost" disabled={busy} onClick={autoShip}>Ship via Shiprocket</button>}
                {data.next.map((n) => <button key={n} className={"btn" + (n === "cancelled" ? " danger" : "")} onClick={() => move(n)}>{n === "cancelled" ? "Cancel order" : "Mark " + n.replace(/_/g, " ")}</button>)}
              </div>
            </div>
          )}
        </>}
      </div>
    </div>
  );
}
