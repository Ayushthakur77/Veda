"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const blank = { seller_type: "ayush", business_name: "", owner_name: "", phone: "", email: "", gstin: "", pan: "", drug_licence_no: "", licence_expiry: "", pharmacist_name: "", pharmacist_reg_no: "", premises_address: "", city: "", pincode: "", bank_holder: "", bank_account_no: "", bank_ifsc: "", agree: false };

export default function SellClient() {
  const [me, setMe] = useState(undefined);
  const [f, setF] = useState(blank);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () => fetch("/api/seller/me", { cache: "no-store" }).then((r) => r.json()).then(setMe).catch(() => setMe({ seller: null }));
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setMsg(""); setBusy(true);
    try {
      const r = await fetch("/api/seller/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Could not submit.");
      load();
    } catch (x) { setMsg(x.message); }
    setBusy(false);
  };
  const pharm = f.seller_type === "pharmacy";
  const Fld = ({ k, label, type = "text", wide, req, ...rest }) => <label className={"fld" + (wide ? " wide" : "")}><span>{label}{req ? " *" : ""}</span><input type={type} value={f[k]} onChange={set(k)} required={req} {...rest} /></label>;

  return (
    <div className="container"><div className="page">
      <h1>Sell on Veda</h1>
      <p>Reach customers across Delhi NCR. We handle the storefront, payments and courier pickup; you pack and invoice. We verify every seller’s licence, premises, pharmacist and identity before approval, and settle your earnings to your bank after delivery.</p>
      <ul>
        <li>AYUSH / wellness sellers: Ayurvedic, Homeopathy and healthcare products.</li>
        <li>Licensed pharmacies: valid drug licence and a registered pharmacist are mandatory. Prescription-only medicines are not allowed yet.</li>
      </ul>
      {me === undefined ? <p>Loading…</p> : me.seller ? (
        <div className="box">
          <p>Application for <b>{me.seller.business_name}</b>: <b>{me.seller.status}</b></p>
          {me.seller.status === "approved" ? <Link href="/seller" className="btn">Open seller panel</Link> : <p className="muted">{me.seller.status === "pending" ? "We are verifying your documents. This usually takes a few working days." : me.seller.admin_note}</p>}
        </div>
      ) : !me.loggedIn ? (
        <p><Link className="btn" href="/login?next=/sell">Log in to apply</Link></p>
      ) : (
        <form className="box grid2" onSubmit={submit}>
          <label className="fld wide"><span>Seller type *</span><select value={f.seller_type} onChange={set("seller_type")}><option value="ayush">AYUSH / wellness / healthcare products</option><option value="pharmacy">Licensed pharmacy</option></select></label>
          <Fld k="business_name" label="Business / shop name" req maxLength={160} />
          <Fld k="owner_name" label="Owner name" req maxLength={120} />
          <Fld k="phone" label="Mobile number" req inputMode="numeric" maxLength={10} />
          <Fld k="email" label="E-mail" type="email" maxLength={160} />
          <Fld k="gstin" label="GSTIN" maxLength={15} />
          <Fld k="pan" label="PAN" maxLength={10} />
          {pharm && <>
            <Fld k="drug_licence_no" label="Drug licence number" req maxLength={60} />
            <Fld k="licence_expiry" label="Licence valid till" type="date" req />
            <Fld k="pharmacist_name" label="Registered pharmacist name" req maxLength={120} />
            <Fld k="pharmacist_reg_no" label="Pharmacist registration no." req maxLength={60} />
          </>}
          <label className="fld wide"><span>Licensed premises / pickup address *</span><textarea rows={2} value={f.premises_address} onChange={set("premises_address")} required maxLength={500} /></label>
          <Fld k="city" label="City" req maxLength={80} />
          <Fld k="pincode" label="Pincode" req inputMode="numeric" maxLength={6} />
          <Fld k="bank_holder" label="Bank account holder name" req maxLength={120} />
          <Fld k="bank_account_no" label="Bank account number" req inputMode="numeric" maxLength={18} />
          <Fld k="bank_ifsc" label="IFSC" req maxLength={11} />
          <p className="muted wide">You can send licence copies when we contact you during verification. Details are used only for verification and settlement.</p>
          <label className="wide"><input type="checkbox" checked={f.agree} onChange={set("agree")} /> I accept the <Link href="/seller-agreement" target="_blank" className="link-btn">Seller Agreement</Link> and confirm the details are true.</label>
          <div className="wide row">{msg && <span className="bad">{msg}</span>}<button className="btn" disabled={busy}>{busy ? "Submitting…" : "Submit application"}</button></div>
        </form>
      )}
    </div></div>
  );
}
