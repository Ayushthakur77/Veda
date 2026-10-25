// Usage: DATABASE_URL=postgres://... node scripts/migrate.mjs
import pg from "pg";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is not set"); process.exit(1); }
const client = new pg.Client({ connectionString: url, ssl: sslFor(url) });
function sslFor(u) { return /localhost|127\.0\.0\.1/.test(u) ? false : { rejectUnauthorized: false }; }

await client.connect();
try {
  const { rows } = await client.query("SELECT to_regclass('public.users') AS t");
  if (rows[0].t) { console.log("Base schema already applied."); }
  else {
    await client.query("BEGIN");
    await client.query(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
    await client.query("COMMIT");
    console.log("Base schema applied.");
  }
  for (const f of ["002_admin.sql", "003_checkout.sql", "004_google.sql", "005_sellers.sql"]) {
    await client.query(readFileSync(new URL(`../db/${f}`, import.meta.url), "utf8"));
    console.log(`${f} applied.`);
  }
} catch (e) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Migration failed:", e.message); process.exitCode = 1;
} finally { await client.end(); }
