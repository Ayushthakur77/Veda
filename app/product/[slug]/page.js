import { notFound } from "next/navigation";
import ProductClient from "../../../components/ProductClient";
import { products, getProduct } from "../../../lib/data";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const p = getProduct(params.slug);
  return p ? { title: p.name_en, description: p.desc_en } : { title: "Product" };
}

export default function ProductPage({ params }) {
  const p = getProduct(params.slug);
  if (!p) notFound();
  return <ProductClient product={p} />;
}
