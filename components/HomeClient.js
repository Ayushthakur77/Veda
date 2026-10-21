"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "./Providers";
import ProductCard from "./ProductCard";
import { banners } from "../lib/data";
import { articles, homeFaq, L } from "../lib/content";
import { cn } from "../lib/format";

function useCountdown() {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      setLeft(Math.max(0, Math.floor((end - now) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  if (left === null) return "--:--:--";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(Math.floor(left / 3600))}:${p(Math.floor((left % 3600) / 60))}:${p(left % 60)}`;
}

function Rail({ title, href, items, deal, extra }) {
  const { t } = useApp();
  if (!items.length) return null;
  return (
    <section className="section">
      <div className="sec-head">
        <h2>{title}</h2>
        {extra}
        {href && <Link href={href}>{t("viewAll")} →</Link>}
      </div>
      <div className="rail">{items.map((p) => <ProductCard key={p.slug} product={p} deal={deal} />)}</div>
    </section>
  );
}

export default function HomeClient({ categories = [], deals = [], popular = [], fresh = [], wellness = [] }) {
  const { t, lang } = useApp();
  const router = useRouter();
  const [i, setI] = useState(0);
  const [q, setQ] = useState("");
  const timer = useCountdown();

  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % banners.length), 5000);
    return () => clearInterval(id);
  }, []);
  const b = banners[i];
  const go = (e) => { e.preventDefault(); const s = q.trim(); if (s) router.push("/search?q=" + encodeURIComponent(s)); };

  return (
    <>
      <section className="hero-search">
        <div className="container">
          <h1>{t("heroQ")}</h1>
          <form className="search" onSubmit={go} role="search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} aria-label={t("search")} />
            <button type="submit" aria-label="Search">🔍</button>
          </form>
          <div className="quick">
            {categories.slice(0, 4).map((c) => <Link key={c.slug} href={`/category/${c.slug}`}>{cn(lang, c)}</Link>)}
          </div>
        </div>
      </section>

      <div className="container">
        <div className="rx-strip">
          <span className="ic">📄</span>
          <div><b>{t("rxTitle")}</b><small>{t("rxSub")}</small></div>
          <span className="soon">{t("soon")}</span>
        </div>

        <div className="offer-tiles">
          <Link href="/offers" className="otile"><span className="em">🏷️</span><b>{t("offers")}</b></Link>
          <Link href="/category/ayurvedic-care" className="otile"><span className="em">🌿</span><b>{t("ayurvedic")}</b></Link>
          <Link href="/category/homeopathy" className="otile"><span className="em">💧</span><b>{t("homeopathy")}</b></Link>
          <Link href="/category/devices" className="otile"><span className="em">🩺</span><b>{t("healthcare")}</b></Link>
        </div>

        <section className="hero" aria-live="polite">
          <div className="hero-in">
            <h2>{lang === "hi" ? b.hi : b.en}</h2>
            <p>{lang === "hi" ? b.subHi : b.subEn}</p>
            <Link href={b.href} className="btn white">{t("shop")} →</Link>
          </div>
          <div className="hero-art" aria-hidden>🌿</div>
          <div className="dots">
            {banners.map((x, n) => (
              <button key={x.id} className={n === i ? "on" : ""} onClick={() => setI(n)} aria-label={`Banner ${n + 1}`} />
            ))}
          </div>
        </section>

        <section className="section">
          <div className="sec-head"><h2>{t("shopByCategory")}</h2><Link href="/browse">{t("browseAZ")} →</Link></div>
          <div className="cats">
            {categories.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="cat">
                <span className="em">{c.emoji}</span>
                <span className="n">{cn(lang, c)}</span>
              </Link>
            ))}
          </div>
        </section>

        <Rail title={t("dealsOfDay")} items={deals} deal extra={<span className="timer">{t("endsIn")} {timer}</span>} />
        <Rail title={t("newLaunch")} items={fresh} />
        <Rail title={t("trending")} items={popular} />
        <Rail title={t("wellness")} items={wellness} href="/category/immunity" />

        <section className="section">
          <div className="sec-head"><h2>{t("whyTitle")}</h2></div>
          <div className="why">
            {["🌱", "🚚", "🔐", "🔔"].map((ic, n) => (
              <div key={n}><span className="ic">{ic}</span><b>{t("why" + (n + 1))}</b><span>{t("why" + (n + 1) + "d")}</span></div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="sec-head"><h2>{t("ourStory")}</h2><Link href="/health-articles">{t("viewAll")} →</Link></div>
          <div className="articles">
            {articles.slice(0, 3).map((a) => (
              <Link key={a.slug} href={`/health-articles#${a.slug}`} className="article">
                <div className="art">{a.em}</div>
                <div className="tx"><small>{L(lang, a.tag)}</small><h3>{L(lang, a.title)}</h3><p>{L(lang, a.sum)}</p></div>
              </Link>
            ))}
          </div>
        </section>

        <section className="section faq">
          <div className="sec-head"><h2>{t("faqTitle")}</h2></div>
          {homeFaq.map((f, n) => (
            <details key={n}><summary>{L(lang, f.q)}</summary><p>{L(lang, f.a)}</p></details>
          ))}
        </section>
      </div>
    </>
  );
}
