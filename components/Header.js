"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "./Providers";
import { cn } from "../lib/format";
import { Icon, Illus, catArt } from "./Icons";
import Brand from "./Brand";

export default function Header({ categories = [] }) {
  const { t, lang, setLang, count, ready, user, authEnabled } = useApp();
  const path = usePathname();
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
  if (path?.startsWith("/admin")) return null;
  return (
    <>
      <header className="header">
        <div className="container header-in">
          <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Menu"><Icon name="menu" size={26} /></button>
          <Brand />
          <form className="search desk" onSubmit={submit} role="search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} aria-label={t("search")} />
            <button type="submit" aria-label="Search"><Icon name="search" size={20} /></button>
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
              <Icon name="cart" size={24} /><span className="hide-m">{t("cart")}</span>
              {ready && count > 0 && <span className="badge">{count}</span>}
            </Link>
          </nav>
        </div>
        <div className="locbar" style={{ color: "var(--green-d)" }}>
          <div className="container">
            <span className="locline"><Icon name="pin" size={16} /> {t("deliveringTo")}</span>
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
            <div className="drawer-top"><Brand onClick={close} height={30} /><button onClick={close} aria-label="Close"><Icon name="close" size={24} /></button></div>
            <form className="search" onSubmit={(e) => { submit(e); close(); }} style={{ margin: 12, border: "1px solid var(--line)", borderRadius: 10 }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} />
              <button type="submit" aria-label="Search"><Icon name="search" size={20} /></button>
            </form>
            <h4>{t("shopByCategory")}</h4>
            {categories.map((c) => <Link key={c.slug} href={`/category/${c.slug}`} onClick={close}><span className="dic"><Illus name={catArt(c.slug)} size={26} /></span>{cn(lang, c)}</Link>)}
            <Link href="/browse" onClick={close}>{t("browseAZ")}</Link>
            <h4>Veda</h4>
            <Link href="/offers" onClick={close}><Icon name="tag" size={18} />{t("offers")}</Link>
            <Link href="/health-articles" onClick={close}><Icon name="news" size={18} />{t("articles")}</Link>
            <Link href="/help" onClick={close}><Icon name="help" size={18} />{t("helpLink")}</Link>
            <Link href="/contact" onClick={close}><Icon name="mail" size={18} />{t("contact")}</Link>
            <Link href="/about" onClick={close}>{t("about")}</Link>
            {authEnabled && <Link href={user ? "/account" : "/login"} onClick={close}><Icon name="user" size={18} />{user ? t("account") : t("login")}</Link>}
          </aside>
        </>
      )}
    </>
  );
}
