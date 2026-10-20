# Veda — Sitemap & Build Plan

Ayurvedic, Homeopathy aur Healthcare e-commerce | Delhi NCR launch | English + Hindi | Web + Android + iOS

## 1. Customer Pages

| Page | URL | Kya hoga |
|---|---|---|
| Home | `/` | Banner carousel + offers, Shop by Category, Deals of the Day (timer), search bar, pincode check |
| Category list | `/category/[slug]` | Filters (brand, price, type), sort, product grid |
| Search results | `/search?q=` | Name search (English + Hindi) |
| Product detail | `/product/[slug]` | Images, price/MRP, ingredients, usage, pack size, add to cart, pincode delivery check |
| Cart | `/cart` | Quantity change, coupon apply, price summary |
| Checkout | `/checkout` | Address select/add, shipping fee (Shiprocket rate), Razorpay payment |
| Order success | `/order/[id]/success` | Confirmation |
| Orders list | `/account/orders` | Past orders, status |
| Order tracking | `/account/orders/[id]` | Status timeline + courier tracking link |
| Login | `/login` | Mobile OTP |
| Profile | `/account` | Name, language, addresses |
| Refill reminders | `/account/refills` | Set/stop monthly refill on any product |
| Offers | `/offers` | Active coupons and deals |
| Static/legal | `/about`, `/privacy`, `/terms`, `/return-policy`, `/shipping-policy`, `/contact` | Footer links |

## 2. Admin Panel (`/admin`)

| Page | Kya hoga |
|---|---|
| Dashboard | Aaj ke orders, revenue, low stock, expiring soon |
| Orders | List, filter by status, update status, create Shiprocket shipment, print invoice/label |
| Products | Add/edit (English + Hindi), images, price, GST, bulk upload via Excel/CSV |
| Categories & Brands | CRUD, ordering |
| Inventory | Batch entry (batch no, expiry, qty), supplier, low-stock and expiry alerts (30/60/90 days) |
| Coupons | Create/edit, limits, first-order-only |
| Deals & Banners | Deals of the Day, homepage carousel |
| Pincodes | Serviceable Delhi NCR pincodes on/off |
| Customers | List, order history |
| Reports | Daily/monthly sales, top products, coupon usage, GST summary |

## 3. Main API Routes

- **Auth:** `POST /auth/send-otp`, `POST /auth/verify-otp`
- **Catalog:** `GET /products`, `GET /products/:slug`, `GET /categories`, `GET /search`
- **Cart:** `GET/POST/PATCH/DELETE /cart`, `POST /cart/coupon`
- **Checkout:** `POST /shipping/rate` (Shiprocket), `POST /orders`, `POST /payments/razorpay/verify`
- **Webhooks:** `POST /webhooks/razorpay`, `POST /webhooks/shiprocket`
- **Account:** `/addresses`, `/orders`, `/refills`, `/device-tokens`
- **Admin:** `/admin/*` (role = admin/staff)

## 4. Integrations

- **Razorpay:** payment order create, signature verify, webhook, refund
- **Shiprocket (Delhivery etc.):** serviceability, rate, create shipment, AWB, tracking webhook
- **OTP SMS:** MSG91 / similar (login ke liye zaroori)
- **Push notifications:** Firebase Cloud Messaging (Android + iOS)
- **Image storage:** Cloudinary / S3
- **Cron jobs:** daily refill reminders, expiry alerts

## 5. Build Phases

1. **Phase 1 — Foundation:** database, auth (OTP), catalog, admin product/category/inventory
2. **Phase 2 — Shopping flow:** search, cart, coupons, checkout, Razorpay
3. **Phase 3 — Delivery:** Shiprocket shipment, tracking, order notifications
4. **Phase 4 — Retention:** refill reminders, deals, banners, reports
5. **Phase 5 — Apps:** Android + iOS (React Native/Expo, same backend API)
6. **Phase 6 — Later:** prescription upload (after Drug License), doctor consult, lab tests, membership

## 6. Launch ke pehle Checklist

- Delhi ke CA/vakeel se Ayurvedic/Homeopathy online selling rules confirm
- Razorpay mein category approval (health products)
- Policies: Privacy, Terms, Return, Shipping
- Product invoices mein GST aur HSN
- Shiprocket account + pickup address setup
- Test orders (10-20) pehle friends/family se
