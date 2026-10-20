"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "./Providers";
import ProductCard from "./ProductCard";
import { banners } from "../lib/data";
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

export default function HomeClient({ categories = [], deals = [], popular = [] }) {
  const { t, lang } = useApp();
  const [i, setI] = useState(0);
  const timer = useCountdown();

  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % banners.length), 5000);
    return () => clearInterval(id);
  }, []);

  const b = banners[i];

  return (
    <div className="container">
      <section className="hero" aria-live="polite">
        <div className="hero-in">
          <h1>{lang === "hi" ? b.hi : b.en}</h1>
          <p>{lang === "hi" ? b.subHi : b.subEn}</p>
          <Link href={b.href} className="btn">{t("shop")} →</Link>
        </div>
        <div className="hero-art" aria-hidden>🌿</div>
        <div className="dots">
          {banners.map((x, n) => (
            <button key={x.id} className={n === i ? "on" : ""} onClick={() => setI(n)} aria-label={`Banner ${n + 1}`} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sec-head"><h2>{t("shopByCategory")}</h2></div>
        <div className="cats">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="cat">
              <span className="em">{c.emoji}</span>
              <span className="n">{cn(lang, c)}</span>
            </Link>
          ))}
        </div>
      </section>

      {deals.length > 0 && (
        <section className="section">
          <div className="sec-head">
            <h2>{t("dealsOfDay")}</h2>
            <span className="timer">{t("endsIn")} {timer}</span>
          </div>
          <div className="grid">
            {deals.map((p) => <ProductCard key={p.slug} product={p} deal />)}
          </div>
        </section>
      )}

      <section className="section">
        <div className="sec-head"><h2>{t("trending")}</h2></div>
        <div className="grid">
          {popular.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>

      <section className="section">
        <div className="why">
          {[1, 2, 3, 4].map((n) => (
            <div key={n}><b>{t("why" + n)}</b><span>{t("why" + n + "d")}</span></div>
          ))}
        </div>
      </section>
    </div>
  );
}
