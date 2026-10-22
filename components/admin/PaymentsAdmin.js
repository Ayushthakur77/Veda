"use client";
import { useState } from "react";
import { api, useLoad, inrA, fmtDate, Status, Empty } from "./api";

export default function PaymentsAdmin() {
  const [st, setSt] = useState("");
  const { data, err, reload } = useLoad(`/api/admin/payments?status=${st}`);
  const refund = async (p) => {
    if (!confirm(`Mark ${p.order_no} (${inrA(p.amount)}) as refunded?\n\nThis only updates Veda's records — send the actual refund from your Razorpay dashboard.`)) return;
    try { await api(`/api/admin/payments/${p.id}`, "PATCH", { action: "mark_refunded" }); reload(); } catch (x) { alert(x.message); }
  };
  const s = data?.summary;
  return (
    <div>
      <h1>Payments</h1>
      {s && <div className="tiles">{[["Received", inrA(s.received)], ["Pending", inrA(s.pending)], ["Refunded", inrA(s.refunded)], ["Failed", s.failed]].map(([l, v]) => <div key={l} className="tile"><b>{v}</b><span>{l}</span></div>)}</div>}
      <div className="filters" style={{ margin: "10px 0" }}>{[["", "All"], ["captured", "Received"], ["created", "Pending"], ["failed", "Failed"], ["refunded", "Refunded"]].map(([v, l]) => <button key={v} className={"pill-b" + (st === v ? " on" : "")} onClick={() => setSt(v)}>{l}</button>)}</div>
      {err && <p className="bad">{err}</p>}
      {data && data.rows.length === 0 && <Empty>No payments yet. They will appear here once Razorpay checkout is live.</Empty>}
      {data && data.rows.length > 0 && <table className="tbl"><thead><tr><th>Order</th><th>Method</th><th>Status</th><th className="r">Amount</th><th></th></tr></thead><tbody>
        {data.rows.map((p) => <tr key={p.id}><td><b>{p.order_no}</b><div className="muted">{fmtDate(p.created_at)} · {p.phone}</div></td><td>{p.method || "—"}<div className="muted">{p.razorpay_payment_id}</div></td><td><Status s={p.status} /></td><td className="r">{inrA(p.amount)}</td>
          <td className="r">{["captured", "paid"].includes(p.status) && <button className="link-btn" onClick={() => refund(p)}>mark refunded</button>}</td></tr>)}</tbody></table>}
    </div>
  );
}
