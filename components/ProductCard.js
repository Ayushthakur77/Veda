"use client";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "./Providers";
import { categories, getCategory, pn, inr, dealPrice } from "../lib/data";

export const emojiFor = (p) => getCategory(p.category)?.emoji ?? "🌿";

export default function ProductCard({ product, deal = false }) {
  const { lang, t, add } = useApp();
  const [done, setDone] = useState(false);
  const price = deal ? dealPrice(product) : product.price;
  const off = Math.round(((product.mrp - price) / product.mrp) * 100);
  const click = () => {
    add(product.slug);
    setDone(true);
    setTimeout(() => setDone(false), 1200);
  };
  return (
    <div className="card">
      <Link href={`/product/${product.slug}`} className="img" aria-label={pn(lang, product)}>
        {emojiFor(product)}
        {off > 0 && <span className="tag">{off}% {t("off")}</span>}
      </Link>
      <div className="body">
        <Link href={`/product/${product.slug}`} className="nm">{pn(lang, product)}</Link>
        <div className="pk">{product.pack}</div>
        <div className="price">
          <b>{inr(price)}</b>
          <s>{inr(product.mrp)}</s>
        </div>
        <button className="btn" onClick={click}>{done ? "✓ " + t("added") : t("add")}</button>
      </div>
    </div>
  );
}
