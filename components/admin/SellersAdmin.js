"use client";
import { useState } from "react";
import { api, useLoad, inrA, Status, Empty, fmtDate } from "./api";

const LABEL = { identity: "Legal identity (PAN/GSTIN) verified", licence: "Drug licence verified with issuing authority", premises: "Licensed premises verified", pharmacist: "Registered pharmacist verified", bank: "Bank account verified (name matches)" };

function Seller({ s, reload }) {
  const [open, setOpen] = useState(s.status === "pending");
  const [note, setNote] = useState(s.admin_note || "");
  const [pct, setPct] = useState(s.commission_percent);
  const [msg, setMsg] = useState("");
  const [pay, setPay] = useState({ amount: "", reference: "" });
  const need = ["identity", "premises", "bank", ...(s.seller_type === "pharmacy" ? ["licence", "pharmacist"] : [])];
  const go = async (patch) => { setMsg(""); try { await api(`/api/admin/sellers/${s.id}`, "PATCH", { commission_percent: pct, admin_note: note, ...patch }); reload(); } catch (x) { setMsg(x.message); } };
  const payout = async (e) => { e.preventDefault(); setMsg(""); try { await api(`/api/admin/sellers/${s.id}/payouts`, "POST", pay); setPay({ amount: "", reference: "" }); reload(); } catch (x) { setMsg(x.message); } };
  const balance = s.gross * (1 - s.commission_percent / 100) - s.paid;
  return (
    <div className="box">
      <div className="row" style={{ justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <div><b>{s.business_name}</b> <span className="muted">· {s.seller_type === "pharmacy" ? "Licensed pharmacy" : "AYUSH / wellness"} · {s.city}</span></div>
        <Status s={s.status} />
      </div>
      {open && <>
        <table className="tbl"><tbody>
          <tr><td className="muted">Owner / phone</td><td>{s.owner_name} · {s.phone} {s.email ? "· " + s.email : ""}</td></tr>
          <tr><td className="muted">GSTIN / PAN</td><td>{s.gstin || "—"} / {s.pan || "—"}</td></tr>
          <tr><td className="muted">Drug licence</td><td>{s.drug_licence_no || "—"} {s.licence_expiry ? `(expires ${String(s.licence_expiry).slice(0, 10)})` : ""}</td></tr>
          <tr><td className="muted">Pharmacist</td><td>{s.pharmacist_name || "—"} · Reg {s.pharmacist_reg_no || "—"}</td></tr>
          <tr><td className="muted">Premises</td><td>{s.premises_address}, {s.city} {s.pincode}</td></tr>
          <tr><td className="muted">Bank</td><td>{s.bank_holder} · A/c {s.bank_account_no} · {s.bank_ifsc}</td></tr>
          <tr><td className="muted">Applied</td><td>{fmtDate(s.created_at)} · agreement accepted {s.agreement_accepted_at ? fmtDate(s.agreement_accepted_at) : "no"}</td></tr>
        </tbody></table>
        <h4 style={{ margin: "10px 0 4px" }}>Verification checklist</h4>
        {Object.keys(LABEL).filter((k) => need.includes(k)).map((k) => (
          <label key={k} style={{ display: "block", padding: "3px 0" }}><input type="checkbox" checked={!!s.checks[k]} onChange={(e) => go({ checks: { [k]: e.target.checked } })} /> {LABEL[k]}</label>
        ))}
        <div className="grid2" style={{ marginTop: 10 }}>
          <label className="fld"><span>Commission %</span><input type="number" min="0" max="60" step="0.5" value={pct} onChange={(e) => setPct(e.target.value)} /></label>
          <label className="fld"><span>Note (required to reject / suspend)</span><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} /></label>
        </div>
        {msg && <p className="bad">{msg}</p>}
        <div className="row" style={{ justifyContent: "flex-start", gap: 8, flexWrap: "wrap" }}>
          {s.status !== "approved" && <button className="btn" onClick={() => go({ status: "approved" })}>Approve</button>}
          {s.status === "pending" && <button className="btn danger" onClick={() => go({ status: "rejected" })}>Reject</button>}
          {s.status === "approved" && <button className="btn danger" onClick={() => { if (confirm("Suspend seller and switch off all their listings?")) go({ status: "suspended" }); }}>Suspend</button>}
          <button className="btn ghost" onClick={() => go({})}>Save changes</button>
        </div>
        {s.status === "approved" && <>
          <h4 style={{ margin: "14px 0 4px" }}>Settlement</h4>
          <p className="muted">Delivered sales {inrA(s.gross)} · paid out {inrA(s.paid)} · balance <b>{inrA(Math.round(balance * 100) / 100)}</b> · {s.products} listings ({s.products_pending} awaiting review — activate them in Listings)</p>
          <form className="row" style={{ justifyContent: "flex-start", gap: 8, flexWrap: "wrap" }} onSubmit={payout}>
            <input type="number" min="1" step="0.01" placeholder="Amount ₹" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} required />
            <input placeholder="Bank ref / UTR" value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} maxLength={80} />
            <button className="btn">Record payout</button>
          </form>
        </>}
      </>}
    </div>
  );
}

export default function SellersAdmin() {
  const { data, err, reload } = useLoad("/api/admin/sellers");
  return (
    <div>
      <div className="bar"><h1>Sellers</h1></div>
      <p className="muted">Verify each seller’s documents with the issuing authority before ticking the checks. A seller can be approved only when all required checks are ticked. Suspending switches off every listing of that seller.</p>
      {err && <p className="bad">{err}</p>}
      {!data ? <p>Loading…</p> : data.sellers.length === 0 ? <Empty>No seller applications yet. Sellers apply at /sell.</Empty> : data.sellers.map((s) => <Seller key={s.id} s={s} reload={reload} />)}
    </div>
  );
}
