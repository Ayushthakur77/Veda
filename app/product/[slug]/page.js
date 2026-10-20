import { notFound } from "next/navigation";
import ProductClient from "../../../components/ProductClient";
import { getProduct, getCategory, getProducts } from "../../../lib/catalog";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const p = await getProduct(params.slug);
  return p ? { title: p.name_en, description: p.desc_en } : { title: "Product" };
}

export default async function ProductPage({ params }) {
  const p = await getProduct(params.slug);
  if (!p) notFound();
  const [category, inCat] = await Promise.all([getCategory(p.category), getProducts({ category: p.category, limit: 8 })]);
  const similar = inCat.filter((x) => x.slug !== p.slug).slice(0, 4);
  return <ProductClient product={p} category={category} similar={similar} />;
}
