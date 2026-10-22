"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./Providers";
import { cn } from "../lib/format";

export default function Footer({ categories = [] }) {
  const { t, lang } = useApp();
  const path = usePathname();
  if (path?.startsWith("/admin")) return null;
  return (
    <footer className="footer">
      <div className="container">
        <div className="cols">
          <div>
            <div className="logo">🌿 Veda.</div>
            <p style={{ marginTop: 10, maxWidth: 360 }}>{t("footerTag")}</p>
            <div className="pay" aria-label="Payments">
              <span>UPI</span><span>Visa</span><span>Mastercard</span><span>RuPay</span><span>Netbanking</span><span>Razorpay</span>
            </div>
          </div>
          <div>
            <b>{t("shop")}</b>
            <ul>
              {categories.slice(0, 6).map((c) => <li key={c.slug}><Link href={`/category/${c.slug}`}>{cn(lang, c)}</Link></li>)}
              <li><Link href="/browse">{t("browseAZ")}</Link></li>
            </ul>
          </div>
          <div>
            <b>Veda</b>
            <ul>
              <li><Link href="/about">{t("about")}</Link></li>
              <li><Link href="/health-articles">{t("articles")}</Link></li>
              <li><Link href="/offers">{t("offers")}</Link></li>
              <li><Link href="/contact">{t("contact")}</Link></li>
            </ul>
          </div>
          <div>
            <b>{t("helpLink")}</b>
            <ul>
              <li><Link href="/help">{t("helpLink")}</Link></li>
              <li><Link href="/return-policy">{t("returns")}</Link></li>
              <li><Link href="/privacy">{t("privacy")}</Link></li>
              <li><Link href="/terms">{t("terms")}</Link></li>
            </ul>
          </div>
        </div>
        <p className="fine">© {new Date().getFullYear()} Veda. {t("disclaimer")}</p>
      </div>
    </footer>
  );
}
