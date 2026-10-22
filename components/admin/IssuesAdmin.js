"use client";
import { useState } from "react";
import { api, useLoad, fmtDate, Status, Empty, Field } from "./api";

export default function IssuesAdmin() {
  const [st, setSt] = useState("");
  const { data, err, reload } = useLoad(`/api/admin/issues?status=${st}`);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const create = async (e) => { e.preventDefault(); setMsg(""); try { await api("/api/admin/issues", "POST", form); setForm(null); reload(); } catch (x) { setMsg(x.message); } };
  const act = async (i, status) => {
    const body = { status };
    if (status === "resolved") { const v = prompt("Resolution note (optional)"); if (v === null) return; if (v) body.admin_note = v; }
    try { await api(`/api/admin/issues/${i.id}`, "PATCH", body); reload(); } catch (x) { alert(x.message); }
  };
  return (
    <div>
      <div className="bar"><h1>Issues</h1><button className="btn" onClick={() => setForm({ subject: "", message: "", order_no: "", priority: "normal" })}>+ New issue</button></div>
      <div className="filters">{[["", "All"], ["open", "Open"], ["in_progress", "In progress"], ["resolved", "Resolved"]].map(([v, l]) => <button key={v} className={"pill-b" + (st === v ? " on" : "")} onClick={() => setSt(v)}>{l}</button>)}</div>
      {form && <form className="box grid2" onSubmit={create}>
        <Field label="Subject" wide><input required value={form.subject} onChange={set("subject")} /></Field>
        <Field label="Order number (optional)"><input value={form.order_no} onChange={set("order_no")} /></Field>
        <Field label="Priority"><select value={form.priority} onChange={set("priority")}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></Field>
        <Field label="Details" wide><textarea rows={3} value={form.message} onChange={set("message")} /></Field>
        {msg && <p className="bad wide">{msg}</p>}
        <div className="row wide"><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn">Save</button></div>
      </form>}
      {err && <p className="bad">{err}</p>}
      {data && data.rows.length === 0 && <Empty>No issues. 🎉</Empty>}
      {data && data.rows.length > 0 && <table className="tbl"><thead><tr><th>Issue</th><th>Priority</th><th>Status</th><th></th></tr></thead><tbody>
        {data.rows.map((i) => <tr key={i.id}>
          <td><b>{i.subject}</b>{i.message && <div className="muted">{i.message}</div>}<div className="muted">{[i.order_no, i.name || i.phone, fmtDate(i.created_at)].filter(Boolean).join(" · ")}</div>{i.admin_note && <div className="muted">Note: {i.admin_note}</div>}</td>
          <td><Status s={i.priority} /></td><td><Status s={i.status} /></td>
          <td className="r">{i.status === "open" && <button className="link-btn" onClick={() => act(i, "in_progress")}>start</button>}{i.status !== "resolved" && <button className="link-btn" style={{ marginLeft: 8 }} onClick={() => act(i, "resolved")}>resolve</button>}</td>
        </tr>)}</tbody></table>}
    </div>
  );
}
