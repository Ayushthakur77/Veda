"use client";
import ListClient from "./ListClient";
import { useApp } from "./Providers";
import { cn } from "../lib/format";

export default function CategoryTitle({ c, list }) {
  const { lang } = useApp();
  const name = cn(lang, c);
  const seo = (
    <>
      <h2>{lang === "hi" ? `${name} ऑनलाइन खरीदें` : `Buy ${name} online`}</h2>
      <p>{lang === "hi"
        ? `वेद पर ${name} की रेंज देखें और दिल्ली NCR में घर बैठे डिलीवरी पाएं। उपयोग से पहले लेबल पढ़ें और ज़रूरत हो तो योग्य चिकित्सक से सलाह लें।`
        : `Browse our ${name} range and get doorstep delivery across Delhi NCR. Read the label before use and consult a qualified practitioner if needed.`}</p>
    </>
  );
  return <ListClient title={name} products={list} seo={seo} />;
}
