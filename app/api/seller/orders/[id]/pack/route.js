import { Invalid, isUuid, str } from "../../../../../../lib/admin";
import { sellerRoute } from "../../../../../../lib/seller";
import { tx } from "../../../../../../lib/db";

export const dynamic = "force-dynamic";

// Seller confirms their items are packed and records the tax invoice number (auto-generated if left blank).
export const POST = sellerRoute(async ({ params, body, seller }) => {
  if (!isUuid(params.id)) throw new Invalid("Bad order id.");
  return tx(async (c) => {
    const { rows: [o] } = await c.query(`SELECT id, order_no, status, payment_status FROM orders WHERE id=$1 FOR UPDATE`, [params.id]);
    if (!o) throw new Invalid("Order not found.");
    if (o.payment_status !== "paid" || !["placed", "confirmed"].includes(o.status)) throw new Invalid("This order can no longer be packed.");
    const { rowCount } = await c.query(`UPDATE order_items SET seller_status='packed' WHERE order_id=$1 AND seller_id=$2 AND seller_status='pending'`, [params.id, seller.id]);
    if (!rowCount) throw new Invalid("Nothing to pack for you in this order.");
    const inv = str(body.invoice_no, 40) || `INV-${o.order_no}`;
    await c.query(`INSERT INTO seller_invoices (order_id, seller_id, invoice_no) VALUES ($1,$2,$3) ON CONFLICT (order_id, seller_id) DO NOTHING`, [params.id, seller.id, inv]);
    await c.query(`INSERT INTO order_status_history (order_id, status, note) VALUES ($1,$2,$3)`, [params.id, o.status, `Packed by seller ${seller.business_name} · invoice ${inv}`]);
    return { ok: true, invoice_no: inv };
  });
}, { write: true });
