"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "./Providers";
import { cn } from "../lib/format";

export default function Header({ categories = [] }) {
  const { t, lang, setLang, count, ready, user, authEnabled } = useApp();
  const [q, setQ] = useState("");
  const router = useRouter();
  const submit = (e) => {
    e.preventDefault();
    const s = q.trim();
    if (s) router.push("/search?q=" + encodeURIComponent(s));
  };
  return (
    <>
      <div className="topbar">{t("deliveringTo")} · {t("footerTag")}</div>
      <header className="header">
        <div className="container header-in">
          <Link href="/" className="logo">Veda<span>.</span></Link>
          <form className="search" onSubmit={submit} role="search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} aria-label={t("search")} />
            <button type="submit" aria-label="Search">🔍</button>
          </form>
          <nav className="nav">
            <button className="lang" onClick={() => setLang(lang === "en" ? "hi" : "en")} aria-label="Change language">
              {lang === "en" ? "हिंदी" : "English"}
            </button>
            {authEnabled && (user
              ? <Link href="/account">👤 {t("account")}</Link>
              : <Link href="/login">{t("login")}</Link>)}
            <Link href="/cart" className="cart-link">
              🛒 {t("cart")}
              {ready && count > 0 && <span className="badge">{count}</span>}
            </Link>
          </nav>
        </div>
        <div className="container subnav">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`}>{cn(lang, c)}</Link>
          ))}
        </div>
      </header>
    </>
  );
}
