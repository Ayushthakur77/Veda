"use client";
import Link from "next/link";
import { useApp } from "./Providers";
import { cn } from "../lib/format";

export default function Footer({ categories = [] }) {
  const { t, lang } = useApp();
  return (
    <footer className="footer">
      <div className="container">
        <div className="cols">
          <div>
            <div className="logo">Veda.</div>
            <p style={{ marginTop: 10 }}>{t("footerTag")}</p>
          </div>
          <div>
            <b>{t("shop")}</b>
            <ul>
              {categories.slice(0, 5).map((c) => (
                <li key={c.slug}><Link href={`/category/${c.slug}`}>{cn(lang, c)}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <b>Veda</b>
            <ul>
              <li><Link href="/about">{t("about")}</Link></li>
              <li><Link href="/privacy">{t("privacy")}</Link></li>
              <li><Link href="/terms">{t("terms")}</Link></li>
              <li><Link href="/return-policy">{t("returns")}</Link></li>
            </ul>
          </div>
        </div>
        <p className="fine">© {new Date().getFullYear()} Veda. {t("disclaimer")}</p>
      </div>
    </footer>
  );
}
