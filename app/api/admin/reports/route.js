import { NextResponse } from "next/server";
import { adminRoute, Invalid } from "../../../../lib/admin";
import { query } from "../../../../lib/db";

export const dynamic = "force-dynamic";

const REPORTS = {
  sales: { title: "Sales by day", cols: ["Date", "Orders", "Gross sales", "Discount", "Shipping", "GST", "Net revenue"], range: true,
    sql: `SELECT created_at::date::text, count(*)::int, sum(subtotal)::float8, sum(discount)::float8, sum(shipping_fee)::float8, sum(gst_amount)::float8, sum(total)::float8
          FROM orders WHERE status NOT IN ('cancelled','returned') AND created_at::date BETWEEN $1 AND $2 GROUP BY 1 ORDER BY 1` },
  orders: { title: "Order list", cols: ["Order", "Date", "Customer", "Phone", "Status", "Payment", "Total"], range: true,
    sql: `SELECT o.order_no, o.created_at::date::text, u.name, u.phone, o.status, o.payment_status, o.total::float8
          FROM orders o JOIN users u ON u.id=o.user_id WHERE o.created_at::date BETWEEN $1 AND $2 ORDER BY o.created_at DESC` },
  gst: { title: "GST summary by rate", cols: ["GST %", "Units", "Taxable value", "GST amount"], range: true,
    sql: `SELECT i.gst_percent::float8, sum(i.quantity)::int, round(sum(i.quantity*i.unit_price/(1+i.gst_percent/100)),2)::float8,
                 round(sum(i.quantity*i.unit_price - i.quantity*i.unit_price/(1+i.gst_percent/100)),2)::float8
          FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.status NOT IN ('cancelled','returned') AND o.created_at::date BETWEEN $1 AND $2
          GROUP BY 1 ORDER BY 1` },
  inventory: { title: "Inventory valuation", cols: ["SKU", "Product", "Batch", "Expiry", "Qty", "Purchase price", "Stock value"], range: false,
    sql: `SELECT p.sku, p.name_en, b.batch_no, b.expiry_date::text, b.qty_available, b.purchase_price::float8, round(b.qty_available*coalesce(b.purchase_price,0),2)::float8
          FROM inventory_batches b JOIN products p ON p.id=b.product_id WHERE b.qty_available>0 ORDER BY p.name_en, b.expiry_date` },
  expiry: { title: "Expiry report (next 180 days)", cols: ["SKU", "Product", "Batch", "Expiry", "Days left", "Qty"], range: false,
    sql: `SELECT p.sku, p.name_en, b.batch_no, b.expiry_date::text, (b.expiry_date-current_date), b.qty_available
          FROM inventory_batches b JOIN products p ON p.id=b.product_id WHERE b.qty_available>0 AND b.expiry_date <= current_date+180 ORDER BY b.expiry_date` },
};
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const csvCell = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) || /^[=+\-@]/.test(s) ? `"${(/^[=+\-@]/.test(s) ? "'" : "") + s.replace(/"/g, '""')}"` : s; };

export const GET = adminRoute(async ({ req }) => {
  const sp = new URL(req.url).searchParams;
  const def = REPORTS[sp.get("type")];
  if (!def) return { types: Object.entries(REPORTS).map(([k, v]) => ({ key: k, title: v.title, range: v.range })) };
  const today = new Date().toISOString().slice(0, 10);
  const from = DATE.test(sp.get("from") || "") ? sp.get("from") : new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
  const to = DATE.test(sp.get("to") || "") ? sp.get("to") : today;
  if (from > to) throw new Invalid("'From' date is after 'To' date.");
  const rows = (await query({ text: def.sql, values: def.range ? [from, to] : [], rowMode: "array" })).rows;
  if (sp.get("format") === "csv") {
    const body = [def.cols, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    return new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="veda-${sp.get("type")}-${from}_${to}.csv"` } });
  }
  return { title: def.title, cols: def.cols, rows, from, to, range: def.range };
});
