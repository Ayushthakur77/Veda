import { one } from "../../../../lib/db";
import { sellerRoute } from "../../../../lib/seller";
import { earnings } from "../earnings/calc";

export const dynamic = "force-dynamic";

export const GET = sellerRoute(async ({ seller }) => {
  const c = await one(`
    SELECT (SELECT count(*)::int FROM products WHERE seller_id=$1) AS products,
           (SELECT count(*)::int FROM products WHERE seller_id=$1 AND is_active) AS live,
           (SELECT count(DISTINCT oi.order_id)::int FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.seller_id=$1 AND oi.seller_status='pending' AND o.status IN ('placed','confirmed') AND (o.payment_status='paid' OR o.payment_method='cod')) AS to_pack,
           (SELECT count(DISTINCT oi.order_id)::int FROM order_items oi WHERE oi.seller_id=$1) AS orders,
           (SELECT count(*)::int FROM inventory_batches b JOIN products p ON p.id=b.product_id WHERE p.seller_id=$1 AND b.qty_available>0 AND b.expiry_date < current_date + 60) AS expiring`, [seller.id]);
  return { ...c, ...(await earnings(seller)) };
});
