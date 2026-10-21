import BrowseClient from "../../components/BrowseClient";
import { getProducts, getCategories } from "../../lib/catalog";
export const revalidate = 60;
export const metadata = { title: "Browse A–Z" };
export default async function Page() {
  const [products, categories] = await Promise.all([getProducts({ limit: 500 }), getCategories()]);
  return <BrowseClient products={products} categories={categories} />;
}
