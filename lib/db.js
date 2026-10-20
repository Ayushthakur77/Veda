import pg from "pg";

export const hasDb = () => Boolean(process.env.DATABASE_URL);

const globalForPg = globalThis;

function createPool() {
  const url = process.env.DATABASE_URL;
  const local = /localhost|127\.0\.0\.1/.test(url);
  return new pg.Pool({
    connectionString: url,
    ssl: local ? false : { rejectUnauthorized: false },
    max: 5,                       // serverless: keep small
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
  });
}

export function pool() {
  if (!hasDb()) throw new Error("DATABASE_URL is not set");
  if (!globalForPg.__vedaPool) globalForPg.__vedaPool = createPool();
  return globalForPg.__vedaPool;
}

export const query = (text, params) => pool().query(text, params);
export const one = async (text, params) => (await query(text, params)).rows[0] ?? null;
export const many = async (text, params) => (await query(text, params)).rows;

export async function tx(fn) {
  const c = await pool().connect();
  try {
    await c.query("BEGIN");
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally { c.release(); }
}
