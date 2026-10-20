"use client";
import Link from "next/link";
import { useApp } from "./Providers";
import { emojiFor } from "./ProductCard";
import { getProduct, pn, inr } from "../lib/data";

export default function CartClient() {
  const { t, lang, cart, setQty, ready } = useApp();
  const items = Object.entries(cart)
    .map(([slug, qty]) => ({ p: getProduct(slug), qty }))
    .filter((x) => x.p);
  const subtotal = items.reduce((s, x) => s + x.p.price * x.qty, 0);

  if (!ready) return <div className="container empty" />;
  if (items.length === 0)
    return (
      <div className="container empty">
        <div style={{ fontSize: 56 }}>🛒</div>
        <p>{t("empty")}</p>
        <Link href="/" className="btn">{t("continueShopping")}</Link>
      </div>
    );

  return (
    <div className="container">
      <div className="sec-head" style={{ marginTop: 24 }}><h2>{t("cart")}</h2></div>
      <div className="cart-grid">
        <div>
          {items.map(({ p, qty }) => (
            <div className="line" key={p.slug}>
              <div className="th" aria-hidden>{emojiFor(p)}</div>
              <div>
                <Link href={`/product/${p.slug}`} style={{ fontWeight: 500 }}>{pn(lang, p)}</Link>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>{p.pack} · {inr(p.price)}</div>
                <button className="link-btn" onClick={() => setQty(p.slug, 0)}>{t("remove")}</button>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="qty">
                  <button onClick={() => setQty(p.slug, qty - 1)} aria-label="Decrease">−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(p.slug, qty + 1)} aria-label="Increase">+</button>
                </div>
                <div style={{ marginTop: 6, fontWeight: 600 }}>{inr(p.price * qty)}</div>
              </div>
            </div>
          ))}
        </div>
        <aside className="summary">
          <div className="row"><span>{t("subtotal")}</span><span>{inr(subtotal)}</span></div>
          <div className="row"><span>{t("shipping")}</span><span>—</span></div>
          <div className="row t"><span>{t("total")}</span><span>{inr(subtotal)}</span></div>
          <small>{t("shippingNote")}</small>
          <button className="btn" style={{ width: "100%", marginTop: 16 }} disabled>{t("checkout")}</button>
          <small>{t("checkoutSoon")}</small>
        </aside>
      </div>
    </div>
  );
}
