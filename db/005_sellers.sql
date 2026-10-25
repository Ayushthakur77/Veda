-- Marketplace: licensed sellers (pharmacies), seller-wise order items, invoices, payouts, launch checklist.
CREATE TABLE IF NOT EXISTS sellers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id),
  business_name   VARCHAR(160) NOT NULL,
  owner_name      VARCHAR(120) NOT NULL,
  phone           VARCHAR(15) NOT NULL,
  email           VARCHAR(160),
  gstin           VARCHAR(15),
  pan             VARCHAR(10),
  seller_type     VARCHAR(20) NOT NULL DEFAULT 'ayush',   -- ayush (ayurvedic/homeopathy/wellness) | pharmacy (licensed medicines)
  drug_licence_no VARCHAR(60),
  licence_expiry  DATE,
  pharmacist_name VARCHAR(120),
  pharmacist_reg_no VARCHAR(60),
  premises_address TEXT NOT NULL,
  city            VARCHAR(80) NOT NULL,
  pincode         VARCHAR(6) NOT NULL,
  bank_holder     VARCHAR(120),
  bank_account_no VARCHAR(24),
  bank_ifsc       VARCHAR(11),
  commission_percent NUMERIC(4,1) NOT NULL DEFAULT 10 CHECK (commission_percent BETWEEN 0 AND 60),
  status          VARCHAR(15) NOT NULL DEFAULT 'pending',  -- pending | approved | rejected | suspended
  checks          JSONB NOT NULL DEFAULT '{}'::jsonb,      -- identity / licence / premises / pharmacist / bank verified flags
  admin_note      TEXT,
  agreement_accepted_at TIMESTAMPTZ,
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sellers_status ON sellers(status);

ALTER TABLE products    ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id);   -- NULL = sold by Veda itself
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS seller_status VARCHAR(10) NOT NULL DEFAULT 'pending'; -- pending | packed
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_items_seller ON order_items(seller_id);

CREATE TABLE IF NOT EXISTS seller_invoices (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id),
  seller_id  UUID NOT NULL REFERENCES sellers(id),
  invoice_no VARCHAR(60) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, seller_id),
  UNIQUE (seller_id, invoice_no)
);

CREATE TABLE IF NOT EXISTS seller_payouts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id  UUID NOT NULL REFERENCES sellers(id),
  amount     NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  reference  VARCHAR(80),
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS launch_checklist (
  key        VARCHAR(40) PRIMARY KEY,
  done       BOOLEAN NOT NULL DEFAULT FALSE,
  note       TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_checklist ENABLE ROW LEVEL SECURITY;
