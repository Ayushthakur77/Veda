"use client";
import Link from "next/link";
import { useApp } from "./Providers";
import ProductCard from "./ProductCard";
import { coupons, L } from "../lib/content";

export default function OffersClient({ deals = [] }) {
  const { t, lang } = useApp();
  return (
    <>
      <div className="list-head"><div className="container"><div className="crumbs" style={{ margin: "12px 0 4px" }}><Link href="/">{t("home")}</Link> / {t("offers")}</div><h1 style={{ fontSize: 24, paddingBottom: 14 }}>{t("offers")}</h1></div></div>
      <div className="container">
        <section className="section">
          {coupons.length === 0 ? (
            <div className="empty" style={{ padding: "30px 0" }}><div style={{ fontSize: 48 }}>🏷️</div><p>{t("offersSoon")}</p></div>
          ) : (
            <div className="coupons">
              {coupons.map((c) => (
                <div key={c.code} className="coupon">
                  <b>{L(lang, c.title)}</b><small>{L(lang, c.desc)}</small>
                  <span className="code">{c.code}</span>
                  <button className="btn ghost" onClick={() => navigator.clipboard?.writeText(c.code)}>{t("copy")}</button>
                </div>
              ))}
            </div>
          )}
        </section>
        {deals.length > 0 && (
          <section className="section">
            <div className="sec-head"><h2>{t("dealsOfDay")}</h2></div>
            <div className="grid">{deals.map((p) => <ProductCard key={p.slug} product={p} deal />)}</div>
          </section>
        )}
      </div>
    </>
  );
}
