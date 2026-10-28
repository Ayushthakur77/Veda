"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "./Providers";
import { Icon } from "./Icons";
import { inr } from "../lib/format";

async function call(url, method = "GET", body) {
  const r = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Request failed");
  return j;
}
function loadRazorpay() {
  return new Promise((res, rej) => {
    if (window.Razorpay) return res();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = res; s.onerror = () => rej(new Error("Could not load the payment service. Check your internet and try again."));
    document.body.appendChild(s);
  });
}

const BANKS = [["SBIN", "State Bank of India"], ["HDFC", "HDFC Bank"], ["ICIC", "ICICI Bank"], ["UTIB", "Axis Bank"], ["KKBK", "Kotak Mahindra Bank"], ["PUNB", "Punjab National Bank"], ["BARB", "Bank of Baroda"], ["YESB", "Yes Bank"]];
const luhn = (n) => { let s = 0, d = false; for (let i = n.length - 1; i >= 0; i--) { let x = +n[i]; if (d) { x *= 2; if (x > 9) x -= 9; } s += x; d = !d; } return n.length >= 13 && s % 10 === 0; };
const brand = (n) => (/^4/.test(n) ? "Visa" : /^(5[1-5]|2[2-7])/.test(n) ? "Mastercard" : /^(60|65|81|82|508)/.test(n) ? "RuPay" : /^3[47]/.test(n) ? "Amex" : "");
const fmtCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
const fmtExp = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };
const UPI_RE = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;

const METHODS = [["rec", "Recommended for You", "thumb"], ["upi", "UPI", "upi", "Pay by any UPI app"], ["card", "Credit / Debit / ATM Card", "card", "Visa, Mastercard, RuPay"], ["nb", "Net Banking", "bank", "All major banks"], ["cod", "Cash on Delivery", "cash"]];

export default function PayClient({ no }) {
  const { user, authEnabled, setQty, ready } = useApp();
  const router = useRouter();
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [m, setM] = useState("rec");
  const [busy, setBusy] = useState(false);
  const [fallback, setFallback] = useState(null);
  const [left, setLeft] = useState("");
  const [upi, setUpi] = useState("");
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "" });
  const [bank, setBank] = useState("");
  const rz = useRef(null);

  const [waited, setWaited] = useState(false);
  useEffect(() => { const id = setTimeout(() => setWaited(true), 1200); return () => clearTimeout(id); }, []);
  useEffect(() => { if (user) setWaited(true); }, [user]);
  useEffect(() => { if (waited && !user) router.replace(authEnabled ? `/login?next=/pay/${no}` : "/"); }, [waited, user, authEnabled, router, no]);
  const load = useCallback(() => call(`/api/checkout/pay-info?no=${encodeURIComponent(no)}`).then(setD).catch((e) => setErr(e.message)), [no]);
  useEffect(() => { if (user) load(); }, [user, load]);

  useEffect(() => {
    if (!d?.expiresAt) return;
    const tick = () => { const s = Math.max(0, Math.round((new Date(d.expiresAt) - Date.now()) / 1000)); setLeft(`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`); };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [d?.expiresAt]);

  const done = useCallback(() => { (d?.items || []).forEach((i) => setQty(i.slug, 0)); router.replace(`/orders/${no}?new=1`); }, [d, setQty, router, no]);
  useEffect(() => { if (d && (d.payment_status === "paid" || d.payment_method === "cod") && d.status !== "cancelled") router.replace(`/orders/${no}?new=1`); }, [d, router, no]);

  const verify = async (resp) => { try { await call("/api/checkout/verify", "POST", resp); done(); } catch (x) { setErr(x.message); setBusy(false); } };

  // Standard Razorpay window, pre-selected to the chosen method (fallback when in-page payment is not enabled for this account).
  const openWindow = async (prefill = {}) => {
    setErr(""); setBusy(true);
    try {
      await loadRazorpay();
      const w = new window.Razorpay({
        key: d.keyId, order_id: d.gateway_order_id, amount: Math.round(d.total * 100), currency: "INR", name: "Veda", description: d.order_no,
        prefill: { contact: d.phone || undefined, email: d.email || undefined, name: d.name || undefined, ...prefill }, theme: { color: "#1f7a45" },
        handler: verify, modal: { ondismiss: () => setBusy(false) },
      });
      w.on("payment.failed", (r) => { setErr(r?.error?.description || "Payment failed. Please try again."); setBusy(false); });
      w.open();
    } catch (x) { setErr(x.message); setBusy(false); }
  };

  const payInPage = async (data, prefill) => {
    setErr(""); setFallback(null); setBusy(true);
    if (d.mode === "mock") {
      try { await new Promise((r) => setTimeout(r, 900)); await call("/api/checkout/mock-pay", "POST", { gateway_order_id: d.gateway_order_id }); return done(); } catch (x) { setErr(x.message); return setBusy(false); }
    }
    try {
      await loadRazorpay();
      if (!rz.current) {
        rz.current = new window.Razorpay({ key: d.keyId });
        rz.current.on("payment.success", verify);
        rz.current.on("payment.error", (r) => { setErr(r?.error?.description || "Payment failed. Please try again."); setFallback(prefill); setBusy(false); });
      }
      rz.current.createPayment({ amount: Math.round(d.total * 100), currency: "INR", email: d.email || "customer@veda.example", contact: d.phone || "9999999999", order_id: d.gateway_order_id, ...data });
    } catch (x) { setErr(x.message); setFallback(prefill); setBusy(false); }
  };

  const payUpi = () => {
    if (!UPI_RE.test(upi.trim())) return setErr("Enter a valid UPI ID, like name@okhdfcbank");
    payInPage({ method: "upi", vpa: upi.trim() }, { method: "upi", vpa: upi.trim() });
  };
  const payCard = () => {
    const n = card.number.replace(/\s/g, ""), [mm, yy] = card.exp.split("/");
    if (!luhn(n)) return setErr("Enter a valid card number.");
    if (!/^(0[1-9]|1[0-2])$/.test(mm || "") || !/^\d{2}$/.test(yy || "")) return setErr("Enter expiry as MM/YY.");
    const nowY = new Date().getFullYear() % 100, nowM = new Date().getMonth() + 1;
    if (+yy < nowY || (+yy === nowY && +mm < nowM)) return setErr("This card has expired.");
    if (!/^\d{3,4}$/.test(card.cvv)) return setErr("Enter the CVV.");
    if (card.name.trim().length < 2) return setErr("Enter the name on the card.");
    payInPage({ method: "card", "card[name]": card.name.trim(), "card[number]": n, "card[cvv]": card.cvv, "card[expiry_month]": mm, "card[expiry_year]": yy }, { method: "card" });
  };
  const payNb = () => { if (!bank) return setErr("Choose your bank."); payInPage({ method: "netbanking", bank }, { method: "netbanking" }); };
  const placeCod = async () => {
    setErr(""); setBusy(true);
    try { await call("/api/checkout/switch-cod", "POST", { order_no: no }); done(); } catch (x) { setErr(x.message); setBusy(false); }
  };

  const pick = (k) => { setM(k); setErr(""); setFallback(null); };
  const total = d ? inr(d.total) : "";
  const upiBox = (
    <div className="pz-form">
      <label className="fld"><span>UPI ID</span><input value={upi} onChange={(e) => setUpi(e.target.value.trim())} placeholder="name@okhdfcbank" autoComplete="off" inputMode="email" /></label>
      <small className="muted">A payment request is sent to your UPI app. Approve it to complete the payment.</small>
      <button className="pz-go" disabled={busy} onClick={payUpi}>{busy ? "Processing…" : `Pay ${total}`}</button>
    </div>
  );

  if (!ready || !user) return <div className="container empty" />;
  if (err && !d) return <div className="container empty"><p>{err}</p><Link href="/orders" className="btn">My orders</Link></div>;
  if (!d) return <div className="container empty"><p>Loading…</p></div>;
  if (d.status === "cancelled") return <div className="container empty"><p>This order was cancelled because payment was not completed in time. Your cart is still saved.</p><Link href="/cart" className="btn">Back to cart</Link></div>;
  const off = d.mode === "off";

  return (
    <div className="pz">
      <div className="pz-head">
        <button className="pz-back" onClick={() => router.push("/checkout")} aria-label="Back"><Icon name="back" size={22} /></button>
        <h1>Complete Payment</h1>
        <span className="pz-secure"><Icon name="lock" size={14} /> 100% Secure</span>
      </div>
      <div className="pz-grid">
        <nav className="pz-methods" aria-label="Payment methods">
          {METHODS.filter(([k]) => (k === "cod" ? d.cod.enabled : true)).map(([k, label, ic, sub]) => (
            <button key={k} className={"pz-m" + (m === k ? " on" : "")} onClick={() => pick(k)} disabled={k === "cod" && !d.cod.ok}>
              <Icon name={ic} size={22} /><span><b>{label}</b>{(sub || (k === "cod" && !d.cod.ok)) && <small>{k === "cod" && !d.cod.ok ? `Not available above ${inr(d.cod.max)}` : sub}</small>}</span>
            </button>
          ))}
        </nav>

        <section className="pz-pane">
          {off && m !== "cod" && <p className="bad">Online payments are not available right now.{d.cod.ok ? " You can still choose Cash on Delivery." : ""}</p>}

          {m === "rec" && <>
            <h3>Pay with UPI</h3>
            {upiBox}
            {d.cod.ok && <div className="pz-card"><b>Cash on Delivery</b><p className="muted">Pay {total} in cash or UPI when your order arrives. No extra fee.</p><button className="pz-go ghost" disabled={busy} onClick={placeCod}>Place Order</button></div>}
          </>}

          {m === "upi" && <><h3>UPI</h3>{upiBox}</>}

          {m === "card" && <>
            <h3>Credit / Debit / ATM Card</h3>
            <div className="pz-form">
              <label className="fld"><span>Card number {brand(card.number.replace(/\s/g, "")) && <em className="pz-brand">{brand(card.number.replace(/\s/g, ""))}</em>}</span>
                <input value={card.number} onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })} inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" /></label>
              <label className="fld"><span>Name on card</span><input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} autoComplete="cc-name" /></label>
              <div className="grid2">
                <label className="fld"><span>Valid thru (MM/YY)</span><input value={card.exp} onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" maxLength={5} /></label>
                <label className="fld"><span>CVV</span><input type="password" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} inputMode="numeric" autoComplete="cc-csc" placeholder="•••" /></label>
              </div>
              <small className="muted">Card details go straight to the secure payment partner. Veda never stores or sees your card number.</small>
              <button className="pz-go" disabled={busy} onClick={payCard}>{busy ? "Processing…" : `Pay ${total}`}</button>
            </div>
          </>}

          {m === "nb" && <>
            <h3>Net Banking</h3>
            <div className="pz-banks">
              {BANKS.map(([code, name]) => <label key={code} className={"pz-bank" + (bank === code ? " on" : "")}><input type="radio" name="bank" checked={bank === code} onChange={() => setBank(code)} />{name}</label>)}
            </div>
            <button className="pz-go" disabled={busy} onClick={payNb}>{busy ? "Processing…" : `Pay ${total}`}</button>
          </>}

          {m === "cod" && <>
            <h3>Cash on Delivery</h3>
            <p className="muted">Pay {total} in cash or UPI to the delivery partner when your order arrives. No extra fee.</p>
            <button className="pz-go" disabled={busy || !d.cod.ok} onClick={placeCod}>{busy ? "Placing…" : "Place Order"}</button>
          </>}

          {err && <p className="bad" style={{ marginTop: 12 }}>{err}</p>}
          {fallback && <p style={{ marginTop: 8 }}><button className="link-btn" onClick={() => openWindow(fallback)}>Having trouble? Pay using the secure payment window</button></p>}
        </section>

        <aside className="pz-sum">
          <div className="pz-row"><span>MRP (incl. of all taxes)</span><span>{inr(d.mrpTotal)}</span></div>
          <div className="pz-row sub"><span>Delivery</span><span>{d.shipping > 0 ? inr(d.shipping) : "FREE"}</span></div>
          {d.discount > 0 && <div className="pz-row ok"><span>MRP Discount</span><span>−{inr(d.discount)}</span></div>}
          <div className="pz-row tot"><span>Total Amount</span><span>{total}</span></div>
          <small className="muted">{d.items.reduce((t, i) => t + i.qty, 0)} item(s) · Order {d.order_no}</small>
          {left && <div className="pz-timer">Complete payment within <b>{left}</b>, or the order is released.</div>}
          {d.mode === "mock" && <small className="muted" style={{ display: "block", marginTop: 8 }}>Test mode: no real money is charged.</small>}
        </aside>
      </div>
    </div>
  );
}
