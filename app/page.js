import HomeClient from "../components/HomeClient";
import { getCategories, getDeals, getPopular, getProducts } from "../lib/catalog";

export const revalidate = 60;

export default async function Home() {
  const [categories, deals, popular, all] = await Promise.all([getCategories(), getDeals(), getPopular(8), getProducts({ limit: 40 })]);
  const fresh = [...all].reverse().slice(0, 8);
  const wellness = all.filter((p) => ["immunity", "digestion", "herbal-juices"].includes(p.category)).slice(0, 8);
  return <HomeClient categories={categories} deals={deals} popular={popular} fresh={fresh} wellness={wellness} />;
}
