"use client";
import { useState } from "react";
import { api, useLoad, inrA, fmtDate, Status, Empty, Field } from "./api";

const TABS = {
  hub: { title: "Hub Orders", filters: [["", "All"], ["placed", "New"], ["confirmed", "Confirmed"], ["packed", "Packed"], ["shipped,out_for_delivery", "In transit"], ["delivered", "Delivered"]] },
  track: { title: "Track Orders", filters: [["shipped,out_for_delivery", "In transit"], ["shipped", "Shipped"], ["out_for_delivery", "Out for delivery"], ["delivered", "Delivered"]] },
  cancelled: { title: "Cancellations", filters: [["cancelled", "Cancelled"]] },
};

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
                : <td><Status s={o.payment_status} /></td>}
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
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const o = data?.order;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="bar"><h2 style={{ margin: 0 }}>{o ? o.order_no : "Order"}</h2><button className="link-btn" onClick={onClose}>Close ✕</button></div>
        {err && <p className="bad">{err}</p>}
        {!data && !err && <p>Loading…</p>}
        {o && <>
          <p><Status s={o.status} /> <Status s={o.payment_status} /> <span className="muted">{fmtDate(o.created_at)}</span></p>
          <p><b>{o.name || "Customer"}</b> · {o.phone}</p>
          <p className="muted">{[o.address_snapshot?.full_name, o.address_snapshot?.line1, o.address_snapshot?.line2, o.address_snapshot?.landmark, o.address_snapshot?.city, o.address_snapshot?.pincode].filter(Boolean).join(", ")}</p>
          <table className="tbl"><tbody>
            {data.items.map((i, n) => <tr key={n}><td>{i.name_snapshot}</td><td className="r">{i.quantity} × {inrA(i.unit_price)}</td></tr>)}
            <tr><td className="muted">Discount / Shipping / GST</td><td className="r muted">−{inrA(o.discount)} / {inrA(o.shipping_fee)} / {inrA(o.gst_amount)}</td></tr>
            <tr><td><b>Total</b></td><td className="r"><b>{inrA(o.total_n)}</b></td></tr>
          </tbody></table>
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
              {msg && <p className="bad">{msg}</p>}
              <div className="row" style={{ justifyContent: "flex-start", marginTop: 10, flexWrap: "wrap" }}>
                {data.next.map((n) => <button key={n} className={"btn" + (n === "cancelled" ? " danger" : "")} onClick={() => move(n)}>{n === "cancelled" ? "Cancel order" : "Mark " + n.replace(/_/g, " ")}</button>)}
              </div>
            </div>
          )}
        </>}
      </div>
    </div>
  );
}
