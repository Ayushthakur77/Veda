"use client";
import { useEffect, useState } from "react";
import { api, inrA } from "./api";

export default function ReportsAdmin() {
  const [types, setTypes] = useState([]);
  const [type, setType] = useState("sales");
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10));
  const [to, setTo] = useState(today);
  const [rep, setRep] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api("/api/admin/reports").then((j) => setTypes(j.types)).catch((e) => setErr(e.message)); }, []);
  const qs = `type=${type}&from=${from}&to=${to}`;
  const run = async () => { setErr(""); setRep(null); try { setRep(await api(`/api/admin/reports?${qs}`)); } catch (e) { setErr(e.message); } };
  const cur = types.find((t) => t.key === type);
  return (
    <div>
      <h1>Reports</h1>
      <div className="box grid2" style={{ alignItems: "end" }}>
        <label className="fld"><span>Report</span><select value={type} onChange={(e) => { setType(e.target.value); setRep(null); }}>{types.map((t) => <option key={t.key} value={t.key}>{t.title}</option>)}</select></label>
        {cur?.range && <><label className="fld"><span>From</span><input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="fld"><span>To</span><input type="date" value={to} max={today} onChange={(e) => setTo(e.target.value)} /></label></>}
        <div className="row" style={{ justifyContent: "flex-start" }}><button className="btn" onClick={run}>View</button><a className="btn ghost" href={`/api/admin/reports?${qs}&format=csv`}>Download CSV</a></div>
      </div>
      {err && <p className="bad">{err}</p>}
      {rep && (rep.rows.length === 0 ? <p className="muted">No data for this selection.</p> :
        <table className="tbl"><thead><tr>{rep.cols.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{rep.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{typeof v === "number" && /amount|sales|revenue|value|price|discount|shipping|gst|taxable/i.test(rep.cols[j]) ? inrA(v) : String(v ?? "")}</td>)}</tr>)}</tbody></table>)}
    </div>
  );
}
