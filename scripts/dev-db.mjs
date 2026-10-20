// Local test Postgres (WASM) on port 5544. Data dir: .pgdata (git-ignored). Usage: node scripts/dev-db.mjs
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
const db = await PGlite.create("./.pgdata");
const server = new PGLiteSocketServer({ db, port: 5544, host: "127.0.0.1" });
await server.start();
console.log("pglite listening on postgres://postgres@127.0.0.1:5544/postgres");
process.on("SIGTERM", async () => { await server.stop(); await db.close(); process.exit(0); });
