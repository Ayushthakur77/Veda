"use client";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "./Providers";
import { pn, inr, dealPrice } from "../lib/format";
import { Illus, catArt } from "./Icons";

export function Thumb({ product, size }) {
  return product.image
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={product.image} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    : <Illus name={catArt(product.category)} size={size || 96} className="thumb-art" />;
}

export default function ProductCard({ product, deal = false }) {
  const { lang, t, add } = useApp();
  const [done, setDone] = useState(false);
  const price = deal ? dealPrice(product) : (product.dealPrice ?? product.price);
  const off = Math.round(((product.mrp - price) / product.mrp) * 100);
  const click = () => {
    add(product.slug);
    setDone(true);
    setTimeout(() => setDone(false), 1200);
  };
  return (
    <div className="card">
      <Link href={`/product/${product.slug}`} className="img" aria-label={pn(lang, product)}>
        <Thumb product={product} />
        {off > 0 && <span className="tag">{off}% {t("off")}</span>}
      </Link>
      <div className="body">
        <Link href={`/product/${product.slug}`} className="nm">{pn(lang, product)}</Link>
        <div className="pk">{product.pack}</div>
        <div className="price">
          <b>{inr(price)}</b>
          <s>{inr(product.mrp)}</s>
        </div>
        <button className="btn" onClick={click} disabled={!product.inStock}>
          {!product.inStock ? t("outOfStock") : done ? "\u2713 " + t("added") : t("add")}
        </button>
      </div>
    </div>
  );
}
