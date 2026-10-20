// Catalogue reads. Uses Postgres when DATABASE_URL is set, otherwise the bundled sample data.
import { hasDb, many, one } from "./db";
import { categories as sampleCats, products as samplePros, dealSlugs } from "./data";
import { dealPrice } from "./format";

const samplePro = (p) => ({ ...p, emoji: sampleCats.find((c) => c.slug === p.category)?.emoji ?? "🌿", image: null, inStock: true, stock: null });

// During `next build` a DB problem must not fail the build; at runtime it must not silently show wrong data.
async function guarded(fn, fallback) {
  if (!hasDb()) return fallback();
  try { return await fn(); }
  catch (e) {
    if (process.env.NEXT_PHASE === "phase-production-build") { console.warn("[catalog] DB unavailable at build, using sample data:", e.message); return fallback(); }
    throw e;
  }
}

const PRODUCT_SQL = `
  SELECT p.id, p.slug, c.slug AS category, p.product_type AS type, p.name_en, p.name_hi, p.pack_size AS pack,
         p.mrp, p.selling_price AS price, p.description_en AS desc_en, p.description_hi AS desc_hi, c.emoji,
         (SELECT url FROM product_images i WHERE i.product_id = p.id ORDER BY sort_order, id LIMIT 1) AS image,
         b.has_batches, b.stock
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN LATERAL (
    SELECT count(*) > 0 AS has_batches,
           coalesce(sum(qty_available) FILTER (WHERE expiry_date > current_date), 0) AS stock
    FROM inventory_batches WHERE product_id = p.id) b ON TRUE
  WHERE p.is_active`;

const norm = (r) => ({
  slug: r.slug, category: r.category, type: r.type,
  name_en: r.name_en, name_hi: r.name_hi || r.name_en, pack: r.pack || "",
  mrp: Number(r.mrp), price: Number(r.price),
  desc_en: r.desc_en || "", desc_hi: r.desc_hi || r.desc_en || "",
  emoji: r.emoji || "🌿", image: r.image || null,
  // no batches recorded = stock not tracked yet (treated as available)
  inStock: !r.has_batches || Number(r.stock) > 0,
  stock: r.has_batches ? Number(r.stock) : null,
  ...(r.deal_price != null ? { dealPrice: Number(r.deal_price) } : {}),
});

export const getCategories = () => guarded(async () => {
  const rows = await many("SELECT slug, name_en, name_hi, emoji FROM categories WHERE is_active ORDER BY sort_order, id");
  return rows.map((r) => ({ slug: r.slug, en: r.name_en, hi: r.name_hi || r.name_en, emoji: r.emoji || "🌿" }));
}, () => sampleCats);

export const getCategory = async (slug) => (await getCategories()).find((c) => c.slug === slug) ?? null;

const escLike = (s) => s.replace(/[\\%_]/g, "\\$&");

export const getProducts = ({ category, q, limit = 200 } = {}) => guarded(async () => {
  const params = []; let where = "";
  if (category) { params.push(category); where += ` AND c.slug = $${params.length}`; }
  if (q) { params.push(`%${escLike(q)}%`); where += ` AND (p.name_en ILIKE $${params.length} OR p.name_hi ILIKE $${params.length} OR p.description_en ILIKE $${params.length})`; }
  params.push(Math.min(limit, 500));
  return (await many(`${PRODUCT_SQL}${where} ORDER BY p.name_en LIMIT $${params.length}`, params)).map(norm);
}, () => {
  let list = samplePros.map(samplePro);
  if (category) list = list.filter((p) => p.category === category);
  if (q) { const s = q.toLowerCase(); list = list.filter((p) => (p.name_en + " " + p.name_hi + " " + p.desc_en).toLowerCase().includes(s)); }
  return list.slice(0, limit);
});

export const getProduct = (slug) => guarded(async () => {
  const r = await one(`${PRODUCT_SQL} AND p.slug = $1`, [slug]);
  return r ? norm(r) : null;
}, () => { const p = samplePros.find((x) => x.slug === slug); return p ? samplePro(p) : null; });

export const getProductsBySlugs = (slugs) => guarded(async () => {
  if (!slugs.length) return [];
  return (await many(`${PRODUCT_SQL} AND p.slug = ANY($1)`, [slugs])).map(norm);
}, () => samplePros.filter((p) => slugs.includes(p.slug)).map(samplePro));

export const getDeals = () => guarded(async () => {
  const rows = await many(`SELECT x.*, d.deal_price FROM deals d JOIN (${PRODUCT_SQL}) x ON x.id = d.product_id
                           WHERE now() BETWEEN d.starts_at AND d.ends_at ORDER BY d.id LIMIT 8`);
  return rows.map(norm);
}, () => dealSlugs.map((s) => samplePros.find((p) => p.slug === s)).filter(Boolean).map((p) => { const x = samplePro(p); return { ...x, dealPrice: dealPrice(x) }; }));

export const getPopular = (limit = 8) => getProducts({ limit });
