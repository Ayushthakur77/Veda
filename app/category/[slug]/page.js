import { notFound } from "next/navigation";
import CategoryTitle from "../../../components/CategoryTitle";
import { getCategory, getProducts } from "../../../lib/catalog";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const c = await getCategory(params.slug);
  return { title: c ? c.en : "Category" };
}

export default async function CategoryPage({ params }) {
  const c = await getCategory(params.slug);
  if (!c) notFound();
  const list = await getProducts({ category: c.slug });
  return <CategoryTitle c={c} list={list} />;
}
