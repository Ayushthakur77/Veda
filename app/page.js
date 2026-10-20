import HomeClient from "../components/HomeClient";
import { getCategories, getDeals, getPopular } from "../lib/catalog";

export const revalidate = 60;

export default async function Home() {
  const [categories, deals, popular] = await Promise.all([getCategories(), getDeals(), getPopular(8)]);
  return <HomeClient categories={categories} deals={deals} popular={popular} />;
}
