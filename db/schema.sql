-- Veda: Ayurvedic / Homeopathy / Healthcare e-commerce (Postgres)
-- Launch: Delhi NCR | Shipping: Shiprocket + Delhivery | Payments: Razorpay

-- gen_random_uuid() is built in (Postgres 13+), no extension needed

-- ============ USERS ============
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         VARCHAR(15) UNIQUE NOT NULL,          -- OTP login
  name          VARCHAR(120),
  email         VARCHAR(160),
  language      VARCHAR(5) NOT NULL DEFAULT 'en',      -- 'en' | 'hi'
  role          VARCHAR(20) NOT NULL DEFAULT 'customer', -- customer | admin | staff
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE otp_codes (
  id          BIGSERIAL PRIMARY KEY,
  phone       VARCHAR(15) NOT NULL,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INT NOT NULL DEFAULT 0,
  used        BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_otp_phone ON otp_codes(phone, expires_at);

CREATE TABLE addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name   VARCHAR(120) NOT NULL,
  phone       VARCHAR(15) NOT NULL,
  line1       TEXT NOT NULL,
  line2       TEXT,
  landmark    TEXT,
  city        VARCHAR(80) NOT NULL,
  state       VARCHAR(80) NOT NULL,
  pincode     VARCHAR(6) NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE device_tokens (            -- push notifications (Android/iOS)
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  platform   VARCHAR(10) NOT NULL,     -- android | ios | web
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ CATALOG ============
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  parent_id   INT REFERENCES categories(id),
  slug        VARCHAR(120) UNIQUE NOT NULL,
  name_en     VARCHAR(120) NOT NULL,
  name_hi     VARCHAR(120),
  image_url   TEXT,
  emoji       VARCHAR(8),
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE brands (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(120) UNIQUE NOT NULL,
  logo_url  TEXT
);

CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku             VARCHAR(60) UNIQUE NOT NULL,
  slug            VARCHAR(200) UNIQUE NOT NULL,
  name_en         VARCHAR(200) NOT NULL,
  name_hi         VARCHAR(200),
  brand_id        INT REFERENCES brands(id),
  category_id     INT REFERENCES categories(id),
  product_type    VARCHAR(20) NOT NULL,       -- ayurvedic | homeopathy | healthcare
  description_en  TEXT,
  description_hi  TEXT,
  ingredients     TEXT,
  usage_info      TEXT,
  pack_size       VARCHAR(60),                -- e.g. "60 tablets", "200 ml"
  mrp             NUMERIC(10,2) NOT NULL,
  selling_price   NUMERIC(10,2) NOT NULL,
  gst_percent     NUMERIC(4,2) NOT NULL DEFAULT 12,
  hsn_code        VARCHAR(10),
  requires_rx     BOOLEAN NOT NULL DEFAULT FALSE,  -- for future prescription feature
  supply_source   VARCHAR(20) NOT NULL DEFAULT 'own', -- own | distributor
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (selling_price <= mrp)
);
CREATE INDEX idx_products_category ON products(category_id) WHERE is_active;
CREATE INDEX idx_products_search ON products
  USING gin (to_tsvector('simple', name_en || ' ' || coalesce(name_hi, '')));

CREATE TABLE product_images (
  id          BIGSERIAL PRIMARY KEY,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0
);

-- ============ INVENTORY (batch + expiry) ============
CREATE TABLE suppliers (
  id       SERIAL PRIMARY KEY,
  name     VARCHAR(160) NOT NULL,
  phone    VARCHAR(15),
  gstin    VARCHAR(15)
);

CREATE TABLE inventory_batches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id),
  supplier_id  INT REFERENCES suppliers(id),
  batch_no     VARCHAR(60) NOT NULL,
  expiry_date  DATE NOT NULL,
  qty_received INT NOT NULL CHECK (qty_received >= 0),
  qty_available INT NOT NULL CHECK (qty_available >= 0),
  purchase_price NUMERIC(10,2),
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, batch_no)
);
CREATE INDEX idx_batches_expiry ON inventory_batches(expiry_date) WHERE qty_available > 0;

-- ============ CART / ORDERS ============
CREATE TABLE carts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cart_items (
  cart_id     UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  quantity    INT NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (cart_id, product_id)
);

CREATE TABLE coupons (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(30) UNIQUE NOT NULL,
  description   TEXT,
  discount_type VARCHAR(10) NOT NULL,          -- percent | flat
  discount_value NUMERIC(10,2) NOT NULL,
  max_discount  NUMERIC(10,2),
  min_order_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  usage_limit   INT,
  per_user_limit INT NOT NULL DEFAULT 1,
  first_order_only BOOLEAN NOT NULL DEFAULT FALSE,
  valid_from    TIMESTAMPTZ NOT NULL,
  valid_to      TIMESTAMPTZ NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE deals (                             -- "Deals of the Day"
  id          SERIAL PRIMARY KEY,
  product_id  UUID NOT NULL REFERENCES products(id),
  deal_price  NUMERIC(10,2) NOT NULL,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL
);

CREATE TABLE banners (                           -- homepage carousel
  id          SERIAL PRIMARY KEY,
  image_url   TEXT NOT NULL,
  link_url    TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no         VARCHAR(20) UNIQUE NOT NULL,   -- e.g. VEDA-100001
  user_id          UUID NOT NULL REFERENCES users(id),
  address_snapshot JSONB NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'placed',
    -- placed | confirmed | packed | shipped | out_for_delivery | delivered | cancelled | returned
  subtotal         NUMERIC(10,2) NOT NULL,
  discount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_fee     NUMERIC(10,2) NOT NULL DEFAULT 0, -- from Shiprocket rate
  gst_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  total            NUMERIC(10,2) NOT NULL,
  coupon_id        INT REFERENCES coupons(id),
  payment_status   VARCHAR(15) NOT NULL DEFAULT 'pending', -- pending | paid | failed | refunded
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE order_items (
  id          BIGSERIAL PRIMARY KEY,
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  batch_id    UUID REFERENCES inventory_batches(id),
  name_snapshot VARCHAR(200) NOT NULL,
  quantity    INT NOT NULL CHECK (quantity > 0),
  mrp         NUMERIC(10,2) NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL,
  gst_percent NUMERIC(4,2) NOT NULL
);

CREATE TABLE order_status_history (
  id         BIGSERIAL PRIMARY KEY,
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     VARCHAR(20) NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ PAYMENTS (Razorpay) ============
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id),
  razorpay_order_id   VARCHAR(60) UNIQUE,
  razorpay_payment_id VARCHAR(60),
  method              VARCHAR(20),                -- upi | card | netbanking
  amount              NUMERIC(10,2) NOT NULL,
  status              VARCHAR(15) NOT NULL DEFAULT 'created',
  raw_payload         JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ SHIPPING (Shiprocket + Delhivery) ============
CREATE TABLE serviceable_pincodes (
  pincode    VARCHAR(6) PRIMARY KEY,
  city       VARCHAR(80),
  is_active  BOOLEAN NOT NULL DEFAULT TRUE         -- Delhi NCR only at launch
);

CREATE TABLE shipments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id),
  shiprocket_order_id VARCHAR(40),
  shipment_id       VARCHAR(40),
  courier_name      VARCHAR(60),                   -- e.g. Delhivery
  awb_code          VARCHAR(60),
  tracking_url      TEXT,
  shipping_cost     NUMERIC(10,2),
  status            VARCHAR(30),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ REFILL REMINDERS ============
CREATE TABLE refill_reminders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id),
  quantity      INT NOT NULL DEFAULT 1,
  every_days    INT NOT NULL CHECK (every_days BETWEEN 7 AND 180),
  next_remind_on DATE NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_refill_due ON refill_reminders(next_remind_on) WHERE is_active;

-- ============ NOTIFICATIONS ============
CREATE TABLE notifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(160) NOT NULL,
  body        TEXT NOT NULL,
  type        VARCHAR(30),                         -- order | refill | offer
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ REVIEWS (later) ============
CREATE TABLE reviews (
  id          BIGSERIAL PRIMARY KEY,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
