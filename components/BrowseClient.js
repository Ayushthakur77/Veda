"use client";
import Link from "next/link";
import { useApp } from "./Providers";
import { pn, cn } from "../lib/format";

export default function BrowseClient({ products = [], categories = [] }) {
  const { t, lang } = useApp();
  const groups = {};
  products.forEach((p) => { const n = pn(lang, p); const k = (n[0] || "#").toUpperCase(); (groups[k] ||= []).push({ p, n }); });
  const keys = Object.keys(groups).sort((a, b) => a.localeCompare(b, lang));
  return (
    <>
      <div className="list-head"><div className="container"><div className="crumbs" style={{ margin: "12px 0 4px" }}><Link href="/">{t("home")}</Link> / {t("browseAZ")}</div><h1 style={{ fontSize: 24, paddingBottom: 14 }}>{t("browseAZ")}</h1></div></div>
      <div className="container" style={{ marginTop: 18 }}>
        <div className="az">{keys.map((k) => <a key={k} href={`#az-${k}`}>{k}</a>)}</div>
        {keys.map((k) => (
          <section key={k} id={`az-${k}`} style={{ marginBottom: 18, scrollMarginTop: 120 }}>
            <h2 style={{ fontSize: 20, color: "var(--green)" }}>{k}</h2>
            <ul style={{ listStyle: "none", columns: "2 240px", marginTop: 6 }}>
              {groups[k].map(({ p, n }) => <li key={p.slug} style={{ padding: "4px 0" }}><Link href={`/product/${p.slug}`}>{n}</Link></li>)}
            </ul>
          </section>
        ))}
        <div className="filters" style={{ marginTop: 20 }}>
          {categories.map((c) => <Link key={c.slug} className="pill" href={`/category/${c.slug}`}>{c.emoji} {cn(lang, c)}</Link>)}
        </div>
      </div>
    </>
  );
}
