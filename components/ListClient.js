"use client";
import { useState } from "react";
import Link from "next/link";
import { useApp } from "./Providers";
import ProductCard from "./ProductCard";
import { pn } from "../lib/data";

export default function ListClient({ title, products, query }) {
  const { t, lang } = useApp();
  const [sort, setSort] = useState("pop");
  const [type, setType] = useState("all");

  let list = products.filter((p) => type === "all" || p.type === type);
  if (query) {
    const q = query.toLowerCase();
    list = list.filter((p) => (p.name_en + " " + p.name_hi + " " + p.desc_en + " " + p.type).toLowerCase().includes(q));
  }
  if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
  if (sort === "name") list = [...list].sort((a, b) => pn(lang, a).localeCompare(pn(lang, b), lang));

  return (
    <div className="container">
      <div className="crumbs"><Link href="/">{t("home")}</Link> / {title}</div>
      <div className="sec-head">
        <h2>{title} <small style={{ fontWeight: 400, color: "var(--muted)", fontSize: 14 }}>({list.length} {t("products")})</small></h2>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="lang" value={type} onChange={(e) => setType(e.target.value)} aria-label={t("type")}>
            <option value="all">{t("type")}: All</option>
            <option value="ayurvedic">{t("ayurvedic")}</option>
            <option value="homeopathy">{t("homeopathy")}</option>
            <option value="healthcare">{t("healthcare")}</option>
          </select>
          <select className="lang" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="pop">Popular</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
            <option value="name">A–Z</option>
          </select>
        </div>
      </div>
      {list.length === 0 ? (
        <div className="empty"><p>{t("noResults")}</p><Link href="/" className="btn">{t("continueShopping")}</Link></div>
      ) : (
        <div className="grid">{list.map((p) => <ProductCard key={p.slug} product={p} />)}</div>
      )}
    </div>
  );
}
