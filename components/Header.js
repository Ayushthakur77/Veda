"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "./Providers";
import { cn } from "../lib/format";

export default function Header({ categories = [] }) {
  const { t, lang, setLang, count, ready, user, authEnabled } = useApp();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const k = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  const submit = (e) => {
    e.preventDefault();
    const s = q.trim();
    if (s) router.push("/search?q=" + encodeURIComponent(s));
  };
  const close = () => setOpen(false);
  return (
    <>
      <header className="header">
        <div className="container header-in">
          <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Menu">☰</button>
          <Link href="/" className="logo"><i aria-hidden>🌿</i>Veda<span>.</span></Link>
          <form className="search desk" onSubmit={submit} role="search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} aria-label={t("search")} />
            <button type="submit" aria-label="Search">🔍</button>
          </form>
          <nav className="nav">
            <Link href="/offers" className="hide-m">{t("offers")}</Link>
            <button className="lang" onClick={() => setLang(lang === "en" ? "hi" : "en")} aria-label="Change language">
              {lang === "en" ? "हिंदी" : "English"}
            </button>
            {authEnabled && (user
              ? <Link href="/account" className="hide-m">{t("account")}</Link>
              : <Link href="/login">{t("login")}</Link>)}
            <Link href="/cart" className="cart-link" aria-label={t("cart")}>
              🛒<span className="hide-m">{t("cart")}</span>
              {ready && count > 0 && <span className="badge">{count}</span>}
            </Link>
          </nav>
        </div>
        <div className="locbar" style={{ color: "var(--green-d)" }}>
          <div className="container">
            <span>📍 {t("deliveringTo")}</span>
            <Link href="/help" style={{ fontWeight: 600 }}>{t("helpLink")}</Link>
          </div>
        </div>
      </header>
      <div className="subnav">
        <div className="container">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`}>{cn(lang, c)}</Link>
          ))}
        </div>
      </div>
      {open && (
        <>
          <div className="drawer-bg" onClick={close} />
          <aside className="drawer" aria-label="Menu">
            <div className="drawer-top"><b>🌿 Veda</b><button onClick={close} aria-label="Close">✕</button></div>
            <form className="search" onSubmit={(e) => { submit(e); close(); }} style={{ margin: 12, border: "1px solid var(--line)", borderRadius: 10 }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} />
              <button type="submit" aria-label="Search">🔍</button>
            </form>
            <h4>{t("shopByCategory")}</h4>
            {categories.map((c) => <Link key={c.slug} href={`/category/${c.slug}`} onClick={close}>{c.emoji} {cn(lang, c)}</Link>)}
            <Link href="/browse" onClick={close}>{t("browseAZ")}</Link>
            <h4>Veda</h4>
            <Link href="/offers" onClick={close}>🏷️ {t("offers")}</Link>
            <Link href="/health-articles" onClick={close}>📰 {t("articles")}</Link>
            <Link href="/help" onClick={close}>❓ {t("helpLink")}</Link>
            <Link href="/contact" onClick={close}>✉️ {t("contact")}</Link>
            <Link href="/about" onClick={close}>{t("about")}</Link>
            {authEnabled && <Link href={user ? "/account" : "/login"} onClick={close}>👤 {user ? t("account") : t("login")}</Link>}
          </aside>
        </>
      )}
    </>
  );
}
