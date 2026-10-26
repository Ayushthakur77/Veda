import { sellerRoute } from "../../../../lib/seller";
import { many } from "../../../../lib/db";

export const dynamic = "force-dynamic";

// One row per order that contains this seller's items. Customer phone is shown only for packing/dispatch support, address only after payment.
export const GET = sellerRoute(async ({ seller }) => ({
  orders: await many(`
    SELECT o.id, o.order_no, o.status, o.payment_status, o.payment_method, o.created_at, o.address_snapshot->>'city' AS city,
           sum(oi.unit_price*oi.quantity)::float8 AS my_total,
           bool_and(oi.seller_status='packed') AS packed,
           json_agg(json_build_object('name', oi.name_snapshot, 'qty', oi.quantity, 'price', oi.unit_price::float8, 'batch', b.batch_no, 'expiry', b.expiry_date::text) ORDER BY oi.id) AS items,
           (SELECT invoice_no FROM seller_invoices si WHERE si.order_id=o.id AND si.seller_id=$1) AS invoice_no
    FROM order_items oi JOIN orders o ON o.id=oi.order_id LEFT JOIN inventory_batches b ON b.id=oi.batch_id
    WHERE oi.seller_id=$1 AND (o.payment_status='paid' OR o.payment_method='cod') AND o.status <> 'cancelled'
    GROUP BY o.id ORDER BY o.created_at DESC LIMIT 200`, [seller.id]),
}));
