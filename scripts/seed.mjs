// Usage: DATABASE_URL=postgres://... node scripts/seed.mjs
// Loads the sample catalogue from lib/data.js into the database (idempotent: upserts by slug).
import pg from "pg";
import { categories, products } from "../lib/data.js";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is not set"); process.exit(1); }
const client = new pg.Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query("BEGIN");
  const catId = {};
  for (const [i, c] of categories.entries()) {
    const r = await client.query(
      `INSERT INTO categories (slug, name_en, name_hi, emoji, sort_order) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (slug) DO UPDATE SET name_en=EXCLUDED.name_en, name_hi=EXCLUDED.name_hi, emoji=EXCLUDED.emoji, sort_order=EXCLUDED.sort_order
       RETURNING id`, [c.slug, c.en, c.hi, c.emoji, i]);
    catId[c.slug] = r.rows[0].id;
  }
  for (const p of products) {
    await client.query(
      `INSERT INTO products (sku, slug, name_en, name_hi, category_id, product_type, description_en, description_hi, pack_size, mrp, selling_price)
       VALUES ($1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (slug) DO UPDATE SET name_en=EXCLUDED.name_en, name_hi=EXCLUDED.name_hi, category_id=EXCLUDED.category_id,
         product_type=EXCLUDED.product_type, description_en=EXCLUDED.description_en, description_hi=EXCLUDED.description_hi,
         pack_size=EXCLUDED.pack_size, mrp=EXCLUDED.mrp, selling_price=EXCLUDED.selling_price`,
      [p.slug, p.name_en, p.name_hi, catId[p.category], p.type, p.desc_en, p.desc_hi, p.pack, p.mrp, p.price]);
  }
  await client.query("COMMIT");
  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
} catch (e) { await client.query("ROLLBACK").catch(() => {}); console.error("Seed failed:", e.message); process.exitCode = 1; }
finally { await client.end(); }
