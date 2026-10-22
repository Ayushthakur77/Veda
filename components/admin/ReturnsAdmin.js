"use client";
import { useState } from "react";
import { api, useLoad, inrA, fmtDate, Status, Empty, Field } from "./api";

export default function ReturnsAdmin() {
  const [st, setSt] = useState("");
  const { data, err, reload } = useLoad(`/api/admin/returns?status=${st}`);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState("");
  const create = async (e) => { e.preventDefault(); setMsg(""); try { await api("/api/admin/returns", "POST", form); setForm(null); reload(); } catch (x) { setMsg(x.message); } };
  const act = async (r, status) => {
    const body = { status };
    if (status === "refunded") { const v = prompt("Refund amount (₹)", r.order_total); if (v === null) return; body.refund_amount = v; }
    if (status === "rejected") { const v = prompt("Reason for rejecting"); if (v === null) return; body.admin_note = v; }
    try { await api(`/api/admin/returns/${r.id}`, "PATCH", body); reload(); } catch (x) { alert(x.message); }
  };
  const NEXT = { requested: ["approved", "rejected"], approved: ["picked_up", "rejected"], picked_up: ["refunded"] };
  return (
    <div>
      <div className="bar"><h1>Returns</h1><button className="btn" onClick={() => setForm({ order_no: "", reason: "" })}>+ Log return</button></div>
      <div className="filters">{[["", "All"], ["requested", "Requested"], ["approved", "Approved"], ["picked_up", "Picked up"], ["refunded", "Refunded"], ["rejected", "Rejected"]].map(([v, l]) => <button key={v} className={"pill-b" + (st === v ? " on" : "")} onClick={() => setSt(v)}>{l}</button>)}</div>
      {form && <form className="box grid2" onSubmit={create}>
        <Field label="Order number"><input required value={form.order_no} onChange={(e) => setForm({ ...form, order_no: e.target.value })} placeholder="VEDA-100001" /></Field>
        <Field label="Reason"><input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
        {msg && <p className="bad wide">{msg}</p>}
        <div className="row wide"><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn">Save</button></div>
      </form>}
      {err && <p className="bad">{err}</p>}
      {data && data.rows.length === 0 && <Empty>No returns.</Empty>}
      {data && data.rows.length > 0 && <table className="tbl"><thead><tr><th>Order</th><th>Reason</th><th>Status</th><th className="r">Refund</th><th></th></tr></thead><tbody>
        {data.rows.map((r) => <tr key={r.id}>
          <td><b>{r.order_no}</b><div className="muted">{r.name || r.phone} · {fmtDate(r.created_at)}</div></td>
          <td>{r.reason}{r.admin_note && <div className="muted">{r.admin_note}</div>}</td>
          <td><Status s={r.status} /></td><td className="r">{r.refund_amount != null ? inrA(r.refund_amount) : "—"}</td>
          <td className="r">{(NEXT[r.status] || []).map((n) => <button key={n} className="link-btn" style={{ marginLeft: 8 }} onClick={() => act(r, n)}>{n.replace("_", " ")}</button>)}</td>
        </tr>)}</tbody></table>}
    </div>
  );
}
