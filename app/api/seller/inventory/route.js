import { Invalid, isUuid, str, num, int } from "../../../../lib/admin";
import { sellerRoute } from "../../../../lib/seller";
import { many, one } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export const GET = sellerRoute(async ({ seller }) => ({
  batches: await many(`
    SELECT b.id, p.name_en AS product, p.sku, b.batch_no, b.expiry_date::text AS expiry_date, (b.expiry_date - current_date) AS days_left, b.qty_received, b.qty_available
    FROM inventory_batches b JOIN products p ON p.id = b.product_id WHERE p.seller_id = $1 ORDER BY b.expiry_date, p.name_en LIMIT 500`, [seller.id]),
  products: await many(`SELECT id, name_en FROM products WHERE seller_id=$1 ORDER BY name_en`, [seller.id]),
}));

export const POST = sellerRoute(async ({ body, seller }) => {
  if (!isUuid(body.product_id)) throw new Invalid("Choose a product.");
  if (!(await one(`SELECT 1 AS x FROM products WHERE id=$1 AND seller_id=$2`, [body.product_id, seller.id]))) throw new Invalid("Product not found.");
  const batch_no = str(body.batch_no, 60);
  if (!batch_no) throw new Invalid("Batch number is required.");
  const expiry = str(body.expiry_date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) || Number.isNaN(Date.parse(expiry))) throw new Invalid("Enter a valid expiry date.");
  if ((await one("SELECT $1::date <= current_date + 30 AS e", [expiry])).e) throw new Invalid("Expiry must be at least 30 days away.");
  const qty = int(body.qty_received);
  if (!(qty > 0) || qty > 1_000_000) throw new Invalid("Quantity must be a positive whole number.");
  const pp = body.purchase_price === "" || body.purchase_price == null ? null : num(body.purchase_price);
  if (pp !== null && !(pp >= 0)) throw new Invalid("Purchase price is invalid.");
  const r = await one(`INSERT INTO inventory_batches (product_id, batch_no, expiry_date, qty_received, qty_available, purchase_price) VALUES ($1,$2,$3,$4,$4,$5) RETURNING id`, [body.product_id, batch_no, expiry, qty, pp]);
  return { id: r.id };
}, { write: true });
