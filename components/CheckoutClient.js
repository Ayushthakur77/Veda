"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "./Providers";
import { inr } from "../lib/format";

async function call(url, method = "GET", body) {
  const r = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Request failed");
  return j;
}
const blank = { full_name: "", phone: "", line1: "", line2: "", landmark: "", city: "", state: "Delhi", pincode: "" };

export default function CheckoutClient() {
  const { t, lang, user, authEnabled, cart, ready } = useApp();
  const router = useRouter();
  const items = Object.entries(cart).map(([slug, qty]) => ({ slug, qty }));
  const key = JSON.stringify(items);
  const [loaded, setLoaded] = useState(false);
  const [quote, setQuote] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [addrs, setAddrs] = useState(null);
  const [sel, setSel] = useState("");
  const [form, setForm] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { const id = setTimeout(() => setLoaded(true), 800); return () => clearTimeout(id); }, []);
  useEffect(() => { if (user) setLoaded(true); }, [user]);
  useEffect(() => { if (loaded && !user) router.replace(authEnabled ? "/login?next=/checkout" : "/cart"); }, [loaded, user, authEnabled, router]);

  const loadAddrs = useCallback(async () => {
    const j = await call("/api/addresses");
    setAddrs(j.rows); setSel((s) => s || j.rows.find((a) => a.is_default)?.id || j.rows[0]?.id || "");
    if (j.rows.length === 0) setForm((f) => f || { ...blank, phone: user?.phone?.replace("+91", "") || "" });
  }, [user]);
  useEffect(() => { if (user) { call("/api/checkout/config").then(setCfg).catch(() => {}); loadAddrs().catch((e) => setErr(e.message)); } }, [user, loadAddrs]);
  useEffect(() => {
    if (!user || !ready || items.length === 0) return;
    setErr(""); call("/api/checkout/quote", "POST", { items }).then(setQuote).catch((e) => { setQuote(null); setErr(e.message); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ready, key]);

  if (!user || !ready) return <div className="container empty" />;
  if (items.length === 0) return <div className="container empty"><p>{t("empty")}</p><Link href="/" className="btn">{t("continueShopping")}</Link></div>;

  const saveAddr = async (e) => {
    e.preventDefault(); setErr("");
    try { const r = await call("/api/addresses", "POST", form); setForm(null); setSel(r.id); await loadAddrs(); } catch (x) { setErr(x.message); }
  };

  const pay = async () => {
    setErr(""); setBusy(true);
    try {
      const o = await call("/api/checkout/create", "POST", { items, address_id: sel });
      router.push(`/pay/${o.order_no}`);
    } catch (x) { setErr(x.message); setBusy(false); }
  };

  const off = cfg?.mode === "off";
  return (
    <div className="container">
      <div className="sec-head" style={{ marginTop: 24 }}><h2>{t("checkoutTitle")}</h2></div>
      <div className="cart-grid">
        <div>
          <section className="box-c">
            <h3>{t("deliveryAddress")}</h3>
            {addrs && addrs.map((a) => (
              <label key={a.id} className={"addr" + (sel === a.id ? " on" : "")}>
                <input type="radio" name="addr" checked={sel === a.id} onChange={() => setSel(a.id)} />
                <span><b>{a.full_name}</b> · {a.phone}<br />{[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}<br />{a.city}, {a.state} {a.pincode}</span>
              </label>
            ))}
            {!form && <button className="btn ghost" onClick={() => setForm({ ...blank, phone: user.phone?.replace("+91", "") || "" })}>+ {t("addAddress")}</button>}
            {form && (
              <form className="grid2" onSubmit={saveAddr} style={{ marginTop: 10 }}>
                {[["full_name", t("fullName")], ["phone", t("mobile")], ["line1", t("addr1")], ["line2", t("addr2")], ["landmark", t("landmark")], ["city", t("city")], ["state", t("state")], ["pincode", t("pincode")]].map(([k, l]) => (
                  <label key={k} className={"fld" + (["line1", "line2", "landmark"].includes(k) ? " wide" : "")}><span>{l}</span>
                    <input required={["full_name", "line1", "city", "pincode", "phone"].includes(k)} value={form[k]} inputMode={["phone", "pincode"].includes(k) ? "numeric" : undefined} maxLength={k === "pincode" ? 6 : undefined}
                      onChange={(e) => setForm({ ...form, [k]: ["phone", "pincode"].includes(k) ? e.target.value.replace(/\D/g, "") : e.target.value })} /></label>
                ))}
                <div className="row wide">{addrs?.length > 0 && <button type="button" className="btn ghost" onClick={() => setForm(null)}>{"✕"}</button>}<button className="btn">{t("save")}</button></div>
              </form>
            )}
          </section>
        </div>
        <aside className="summary">
          {quote && <>
            {quote.lines.map((l) => <div className="row" key={l.slug}><span>{l.name} × {l.qty}</span><span>{inr(l.unit * l.qty)}</span></div>)}
            <div className="row" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}><span>{t("subtotal")}</span><span>{inr(quote.subtotal)}</span></div>
            <div className="row"><span>{t("shipping")}</span><span>{quote.shipping === 0 ? t("free") : inr(quote.shipping)}</span></div>
            <div className="row t"><span>{t("total")}</span><span>{inr(quote.total)}</span></div>
            {quote.shipping > 0 && <small>{t("freeShipHint")} {inr(quote.freeAbove)}</small>}
          </>}
          {err && <p className="bad" style={{ marginTop: 10 }}>{err}</p>}
          
          {!sel && addrs && <small>{t("noAddr")}</small>}
          <button className="btn" style={{ width: "100%", marginTop: 14 }} disabled={!quote || !sel || busy} onClick={pay}>{busy ? t("placing") : `${lang === "hi" ? "भुगतान के लिए आगे बढ़ें" : "Continue to payment"}${quote ? " · " + inr(quote.total) : ""}`}</button>
          {cfg?.mode === "mock" && <small>{t("testMode")}</small>}
        </aside>
      </div>
    </div>
  );
}
