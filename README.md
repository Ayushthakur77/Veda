# Veda

Ayurvedic, Homeopathy & healthcare e-commerce (Delhi NCR). Next.js 14 (App Router) + Postgres.

## Status: Phase 1
- Storefront: home, categories, product, search, cart (cart kept in the browser), English/Hindi.
- Mobile OTP login (`/login`), account page.
- Admin panel (`/admin`): dashboard, products, categories, inventory batches with expiry and low-stock alerts.
- **Works without a database too**: with no `DATABASE_URL` the store shows the sample catalogue (`lib/data.js`), and login/admin stay switched off.
- Not built yet: checkout, Razorpay payments, Shiprocket shipping, orders, coupons, refill reminders, apps. See `docs/sitemap.md` for the plan and `docs/schema.sql` for the full data model.

## Run locally
```
npm install
cp .env.example .env.local      # fill in DATABASE_URL, AUTH_SECRET, ADMIN_PHONES
npm run db:migrate              # creates tables (safe to re-run)
npm run db:seed                 # optional: loads the sample products
npm run dev
```
No Postgres handy? `npm run db:dev` starts a throw-away one on port 5544
(`DATABASE_URL=postgres://postgres@127.0.0.1:5544/postgres`). It allows one connection at a time, for quick tests only.

## First admin
Put your mobile number in `ADMIN_PHONES`, log in at `/login`. With `OTP_PROVIDER=mock` the OTP is printed in the server log
(Vercel: project -> Logs). Numbers in `ADMIN_PHONES` become admins on every login; nobody can become admin any other way.

## Going live on Vercel
1. Create a Postgres database (Neon via Vercel Marketplace, or Supabase). Run `npm run db:migrate` (and optionally `db:seed`) with its `DATABASE_URL`.
2. Vercel project -> Settings -> Environment Variables: `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_PHONES`, `OTP_PROVIDER`.
3. Redeploy. Catalogue pages refresh at most every 60 s, and immediately after an admin edit.
4. For real SMS set `OTP_PROVIDER=msg91`, `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`.

## Using Supabase as the database

Veda talks to Postgres directly from the server, so Supabase works with no code changes.

1. Create a project at supabase.com → **Project Settings → Database → Connection string**.
   Use the **Session pooler** string (port 5432) — it works from Vercel and from your laptop.
   Replace `[YOUR-PASSWORD]` with your database password.
2. On your laptop (in the project folder):
   ```
   DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres" npm run db:migrate
   DATABASE_URL="…same…" npm run db:seed        # optional sample catalogue
   ```
   `db:migrate` is safe to re-run; it creates all tables (including the admin tables) and turns on Row Level Security so Supabase's public REST API can't read your data.
3. In Vercel → Project → Settings → Environment Variables add `DATABASE_URL` (same string), `AUTH_SECRET` (40+ random chars) and `ADMIN_PHONES` (your 10-digit number), then redeploy.

## Admin panel (`/admin`)

Dashboard · Hub Orders · Track Orders · Returns · Cancellations · Issues · Listings (products) · Categories · Inventory · Payments · Performance · Opportunities · Reports (CSV download).
Orders move through placed → confirmed → packed → shipped (courier + AWB required) → out for delivery → delivered; cancelling needs a reason.
"Mark refunded" only updates Veda's records — send the actual refund from the Razorpay dashboard until API refunds are added.

## Checkout & payments

Customers: cart → login → address (Delhi NCR pincodes only) → pay → order page with tracking steps. Prices are re-calculated on the server; stock is reserved FEFO (earliest expiry first) when the order is created and put back if the order is cancelled or left unpaid for 30 minutes.
Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (Razorpay → Settings → API keys) and `RAZORPAY_WEBHOOK_SECRET`.
In Razorpay → Webhooks add `https://<your-site>/api/webhooks/razorpay` with events `payment.captured` and `payment.failed` and the same secret.
Run `npm run db:migrate` (or apply `db/003_checkout.sql`) after pulling this version.
