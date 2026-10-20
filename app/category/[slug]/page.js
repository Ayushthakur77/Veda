import { notFound } from "next/navigation";
import CategoryTitle from "../../../components/CategoryTitle";
import { categories, products, getCategory } from "../../../lib/data";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }) {
  const c = getCategory(params.slug);
  return { title: c ? c.en : "Category" };
}

export default function CategoryPage({ params }) {
  const c = getCategory(params.slug);
  if (!c) notFound();
  const list = products.filter((p) => p.category === c.slug);
  return <CategoryTitle c={c} list={list} />;
}
