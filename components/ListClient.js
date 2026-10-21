"use client";
import { useState } from "react";
import Link from "next/link";
import { useApp } from "./Providers";
import ProductCard from "./ProductCard";
import { pn } from "../lib/format";

export default function ListClient({ title, products, seo }) {
  const { t, lang } = useApp();
  const [sort, setSort] = useState("pop");
  const [type, setType] = useState("all");

  let list = products.filter((p) => type === "all" || p.type === type);
  if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
  if (sort === "disc") list = [...list].sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp);
  if (sort === "name") list = [...list].sort((a, b) => pn(lang, a).localeCompare(pn(lang, b), lang));
  const types = ["all", ...Array.from(new Set(products.map((p) => p.type)))];

  return (
    <>
      <div className="list-head">
        <div className="container">
          <div className="crumbs" style={{ margin: "12px 0 4px" }}><Link href="/">{t("home")}</Link> / {title}</div>
          <h1 style={{ fontSize: 24, paddingBottom: 14 }}>{title} <small style={{ fontWeight: 400, color: "var(--muted)", fontSize: 14 }}>({list.length} {t("products")})</small></h1>
        </div>
      </div>
      <div className="container" style={{ marginTop: 16 }}>
        <div className="filters">
          {types.map((x) => (
            <button key={x} className={"pill" + (type === x ? " on" : "")} onClick={() => setType(x)}>{x === "all" ? "All" : t(x)}</button>
          ))}
          <select className="lang" style={{ marginLeft: "auto" }} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="pop">{t("sortPop")}</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
            <option value="disc">Discount</option>
            <option value="name">A–Z</option>
          </select>
        </div>
        {list.length === 0 ? (
          <div className="empty"><p>{t("noResults")}</p><Link href="/" className="btn">{t("continueShopping")}</Link></div>
        ) : (
          <div className="grid">{list.map((p) => <ProductCard key={p.slug} product={p} />)}</div>
        )}
        {seo && <div className="seo">{seo}</div>}
      </div>
    </>
  );
}
