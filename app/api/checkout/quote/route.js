import { userRoute } from "../../../../lib/shop";
import { quoteCart } from "../../../../lib/checkout";
export const dynamic = "force-dynamic";
export const POST = userRoute(async ({ body }) => {
  const q = await quoteCart(body.items);
  return { lines: q.lines.map((l) => ({ slug: l.slug, name: l.name, qty: l.qty, unit: l.unit, mrp: l.mrp })), subtotal: q.subtotal, shipping: q.shipping, gstAmount: q.gstAmount, total: q.total, freeAbove: q.freeAbove };
}, { write: true });
