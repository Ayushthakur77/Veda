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
