"use client";
import Link from "next/link";
import { useApp } from "./Providers";
import { helpTopics, homeFaq, L } from "../lib/content";
import { Illus } from "./Icons";

export default function HelpClient() {
  const { t, lang } = useApp();
  return (
    <>
      <div className="list-head"><div className="container"><div className="crumbs" style={{ margin: "12px 0 4px" }}><Link href="/">{t("home")}</Link> / {t("helpLink")}</div><h1 style={{ fontSize: 24, paddingBottom: 14 }}>{t("helpLink")}</h1></div></div>
      <div className="container">
        <section className="section"><div className="topics">
          {helpTopics.map((h, n) => {
            const inner = <><span className="em"><Illus color name={h.art} size={44} /></span><b>{L(lang, h.t)}</b><p style={{ color: "var(--muted)", fontSize: 13 }}>{L(lang, h.d)}</p></>;
            return h.href ? <Link key={n} href={h.href} className="topic">{inner}</Link> : <div key={n} className="topic">{inner}</div>;
          })}
        </div></section>
        <section className="section faq">
          <div className="sec-head"><h2>{t("faqTitle")}</h2></div>
          {homeFaq.map((f, n) => <details key={n}><summary>{L(lang, f.q)}</summary><p>{L(lang, f.a)}</p></details>)}
        </section>
        <p style={{ marginTop: 24 }}><Link href="/contact" className="btn">{t("contact")}</Link></p>
      </div>
    </>
  );
}
