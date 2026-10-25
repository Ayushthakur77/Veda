import { sellerRoute } from "../../../../lib/seller";
import { earnings, payouts } from "./calc";

export const dynamic = "force-dynamic";
export const GET = sellerRoute(async ({ seller }) => ({ ...(await earnings(seller)), payouts: await payouts(seller.id) }));
