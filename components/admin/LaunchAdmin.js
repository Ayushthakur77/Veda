"use client";
import { useState } from "react";
import Link from "next/link";
import { api, useLoad } from "./api";
import { DRAFTS } from "../../lib/drafts";

const STEPS = [
  ["dcd_email", "1. Delhi Drugs Control Department ko email bhejein", "Marketplace model, seller onboarding aur payment settlement ke baare mein written clarification maangein. Draft neeche hai — copy karke bhejein, jawab ki copy/ref note mein likh dein."],
  ["docs_verified", "2. Pharmacy aur sellers ke documents verify karein", "Drug licence, licensed premises, registered pharmacist aur legal identity. Har seller ko /admin/sellers mein verify karke hi approve karein (system checks ke bina approve nahi karne deta)."],
  ["gateway_approval", "3. Payment gateway approval lein", "Razorpay ko batayein ki medicine marketplace hai aur sellers ko settlement hoga. Draft neeche hai."],
  ["seller_agreement", "4. Seller agreement taiyar karein", "Draft /seller-agreement par live hai. Apne lawyer se review karwa kar final karein; seller apply karte waqt ise accept karta hai (date record hoti hai)."],
  ["site_compliance", "5. Website compliance check karein", "Neeche automatic checklist dekhein. Prescription upload abhi bana nahi hai — jab tak Rx medicines nahi bechte, zaroorat nahi."],
  ["launch_clearance", "6. Launch clearance confirm karein", "Department ka written jawab aane ke baad hi real medicine orders aur payments activate karein (Razorpay live keys)."],
  ["first_order_test", "7. Pehla order test karein", "Ek genuine order: seller packs + invoice → courier → delivery → settlement payout record. Admin aur seller panel dono se track karein."],
];

const COMPLIANCE = [
  ["/terms", "Terms of Use"], ["/privacy", "Privacy Policy"], ["/return-policy", "Refund & Return Policy"], ["/grievance", "Grievance / complaint contact"], ["/seller-agreement", "Seller Agreement"], ["/sell", "Seller onboarding page"],
];

function Draft({ d }) {
  const [show, setShow] = useState(false);
  const text = `To: ${d.to}\nSubject: ${d.subject}\n\n${d.body}`;
  return (
    <div style={{ marginTop: 8 }}>
      <button className="link-btn" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"} draft: {d.title}</button>
      {show && <>
        <textarea readOnly rows={14} value={text} style={{ width: "100%", marginTop: 6, fontFamily: "inherit", fontSize: 13 }} />
        <button className="btn ghost" onClick={() => navigator.clipboard?.writeText(text)}>Copy</button>
      </>}
    </div>
  );
}

export default function LaunchAdmin() {
  const { data, err, reload } = useLoad("/api/admin/launch");
  const state = Object.fromEntries((data?.items || []).map((i) => [i.key, i]));
  const done = STEPS.filter(([k]) => state[k]?.done).length;
  const save = async (key, d, note) => { try { await api("/api/admin/launch", "PUT", { key, done: d, note }); reload(); } catch (x) { alert(x.message); } };
  return (
    <div>
      <div className="bar"><h1>Launch checklist</h1><b>{done}/7 complete</b></div>
      {err && <p className="bad">{err}</p>}
      {STEPS.map(([k, t, hint]) => {
        const s = state[k] || {};
        return (
          <div className="box" key={k}>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <input type="checkbox" checked={!!s.done} onChange={(e) => save(k, e.target.checked, s.note || null)} style={{ marginTop: 4 }} />
              <span><b>{t}</b><br /><span className="muted">{hint}</span></span>
            </label>
            {DRAFTS[k] && <Draft d={DRAFTS[k]} />}
            {k === "docs_verified" && <p><Link href="/admin/sellers" className="link-btn">Open sellers →</Link></p>}
            {k === "site_compliance" && <ul className="muted" style={{ margin: "8px 0 0 18px" }}>{COMPLIANCE.map(([h, l]) => <li key={h}><Link href={h} className="link-btn" target="_blank">{l}</Link></li>)}<li>Seller name shown on every product page (“Sold by”)</li><li>Prescription medicines blocked from listing</li></ul>}
            <input defaultValue={s.note || ""} key={k + (s.updated_at || "")} placeholder="Note (e.g. reply ref no., date)" maxLength={500} style={{ width: "100%", marginTop: 8 }} onBlur={(e) => e.target.value !== (s.note || "") && save(k, !!s.done, e.target.value)} />
          </div>
        );
      })}
      <p className="muted">Jab tak step 6 (department clearance) complete na ho, sirf non-prescription Ayurvedic / Homeopathy / healthcare products hi sell karein.</p>
    </div>
  );
}
