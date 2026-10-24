"use client";
import Link from "next/link";
import { useApp } from "./Providers";
import { articles, L } from "../lib/content";
import { Illus } from "./Icons";

export default function ArticlesClient() {
  const { t, lang } = useApp();
  return (
    <>
      <div className="list-head"><div className="container"><div className="crumbs" style={{ margin: "12px 0 4px" }}><Link href="/">{t("home")}</Link> / {t("articles")}</div><h1 style={{ fontSize: 24, paddingBottom: 14 }}>{t("articles")}</h1></div></div>
      <div className="container"><div className="page">
        {articles.map((a) => (
          <article key={a.slug} id={a.slug} style={{ marginBottom: 28, scrollMarginTop: 120 }}>
            <div className="art-head"><Illus name={a.art} size={56} /><small style={{ color: "var(--green)", fontWeight: 700 }}>{L(lang, a.tag)}</small></div>
            <h2 style={{ marginTop: 2 }}>{L(lang, a.title)}</h2>
            {(a.body[lang] || a.body.en).map((para, n) => <p key={n}>{para}</p>)}
          </article>
        ))}
      </div></div>
    </>
  );
}
