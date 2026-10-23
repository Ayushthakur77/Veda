"use client";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "./Providers";
import ProductCard, { Thumb } from "./ProductCard";
import { pn, pd, cn, inr } from "../lib/format";
import { L } from "../lib/content";

export default function ProductClient({ product, category: cat, similar = [] }) {
  const { t, lang, add } = useApp();
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState(null);
  const [tab, setTab] = useState("details");
  const eff = product.dealPrice ?? product.price;
  const off = Math.round(((product.mrp - eff) / product.mrp) * 100);

  const checkPin = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) return setMsg({ ok: false, text: t("invalidPin") });
    // Delhi NCR pincodes: Delhi 110xxx, Noida 201301-201310, Gurgaon 122xxx, Ghaziabad 201001-201017, Faridabad 121xxx
    const n = Number(pin);
    const ok = (n >= 110001 && n <= 110099) || (n >= 122001 && n <= 122018) || (n >= 201001 && n <= 201017) || (n >= 201301 && n <= 201310) || (n >= 121001 && n <= 121010);
    setMsg({ ok, text: ok ? t("deliverable") : t("notDeliverable") });
  };

  const addToCart = () => {
    add(product.slug, qty);
    setDone(true);
    setTimeout(() => setDone(false), 1400);
  };

  return (
    <div className="container">
      <div className="crumbs">
        <Link href="/">{t("home")}</Link> / {cat && <><Link href={`/category/${cat.slug}`}>{cn(lang, cat)}</Link> / </>}{pn(lang, product)}
      </div>
      <div className="pd">
        <div className="big" aria-hidden><Thumb product={product} size={140} /></div>
        <div>
          <span className="chip">{t(product.type)}</span>
          <h1>{pn(lang, product)}</h1>
          <div className="price">
            <b>{inr(eff)}</b>
            <s>{t("mrp")} {inr(product.mrp)}</s>
            {off > 0 && <em>{off}% {t("off")}</em>}
          </div>
          <small style={{ color: "var(--muted)" }}>{t("inclTax")}</small>
          <dl className="meta">
            <dt>{t("pack")}</dt><dd>{product.pack}</dd>
            <dt>{t("type")}</dt><dd>{t(product.type)}</dd>
          </dl>

          <form className="pin" onSubmit={checkPin}>
            <input inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder={t("pincode")} aria-label={t("pincode")} />
            <button className="btn ghost" type="submit">{t("check")}</button>
          </form>
          <div className="badges"><span>✅ {t("trust")}</span><span>🚚 {t("trust2")}</span><span>↩️ {t("trust3")}</span></div>
          <div className={"pin-msg " + (msg ? (msg.ok ? "ok" : "bad") : "")}>{msg?.text}</div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 18 }}>
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(Math.min(20, qty + 1))} aria-label="Increase">+</button>
            </div>
            <button className="btn" onClick={addToCart} disabled={!product.inStock}>{!product.inStock ? t("outOfStock") : done ? "✓ " + t("added") : t("add")}</button>
          </div>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {["details", "reviews"].map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{t(k)}</button>
        ))}
      </div>
      <div className="tabpane">
        {tab === "details" ? (
          <>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>{t("description")}</h3>
            <p>{pd(lang, product)}</p>
            <p style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>{t("disclaimer")}</p>
          </>
        ) : <p>{t("noReviews")}</p>}
      </div>

      <div className="buybar">
        <div><b style={{ fontSize: 18 }}>{inr(eff)}</b><br /><s style={{ color: "var(--muted)", fontSize: 12 }}>{inr(product.mrp)}</s></div>
        <button className="btn" onClick={addToCart} disabled={!product.inStock}>{!product.inStock ? t("outOfStock") : done ? "✓ " + t("added") : t("add")}</button>
      </div>

      {similar.length > 0 && (
        <section className="section">
          <div className="sec-head"><h2>{t("similar")}</h2></div>
          <div className="rail">{similar.map((p) => <ProductCard key={p.slug} product={p} />)}</div>
        </section>
      )}
    </div>
  );
}
