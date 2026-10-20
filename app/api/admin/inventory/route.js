import { adminRoute, Invalid, isUuid, str, optStr, num, int } from "../../../../lib/admin";
import { many, one, tx } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async () => ({
  batches: await many(`
    SELECT b.id, b.product_id, p.name_en AS product, p.sku, b.batch_no, b.expiry_date::text AS expiry_date,
           (b.expiry_date - current_date) AS days_left, b.qty_received, b.qty_available, b.purchase_price, s.name AS supplier,
           b.received_at
    FROM inventory_batches b JOIN products p ON p.id = b.product_id LEFT JOIN suppliers s ON s.id = b.supplier_id
    ORDER BY b.expiry_date, p.name_en LIMIT 500`),
}));

export const POST = adminRoute(async ({ body }) => {
  if (!isUuid(body.product_id)) throw new Invalid("Choose a product.");
  const batch_no = str(body.batch_no, 60);
  if (!batch_no) throw new Invalid("Batch number is required.");
  const expiry = str(body.expiry_date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) || Number.isNaN(Date.parse(expiry))) throw new Invalid("Enter a valid expiry date.");
  const qty = int(body.qty_received);
  if (!(qty > 0) || qty > 1_000_000) throw new Invalid("Quantity must be a positive whole number.");
  const pp = body.purchase_price === "" || body.purchase_price == null ? null : num(body.purchase_price);
  if (pp !== null && !(pp >= 0)) throw new Invalid("Purchase price is invalid.");
  const supplier = optStr(body.supplier, 160);
  const expired = await one("SELECT $1::date <= current_date AS e", [expiry]);
  if (expired.e) throw new Invalid("Expiry date must be in the future.");
  const id = await tx(async (c) => {
    let sid = null;
    if (supplier) {
      const f = await c.query("SELECT id FROM suppliers WHERE lower(name) = lower($1) LIMIT 1", [supplier]);
      sid = f.rows[0]?.id ?? (await c.query("INSERT INTO suppliers (name) VALUES ($1) RETURNING id", [supplier])).rows[0].id;
    }
    const r = await c.query(
      `INSERT INTO inventory_batches (product_id, supplier_id, batch_no, expiry_date, qty_received, qty_available, purchase_price)
       VALUES ($1,$2,$3,$4,$5,$5,$6) RETURNING id`, [body.product_id, sid, batch_no, expiry, qty, pp]);
    return r.rows[0].id;
  });
  return { id };
}, { write: true });
