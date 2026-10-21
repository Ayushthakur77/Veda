import OffersClient from "../../components/OffersClient";
import { getDeals } from "../../lib/catalog";

export const revalidate = 60;
export const metadata = { title: "Offers" };

export default async function Page() {
  return <OffersClient deals={await getDeals()} />;
}
