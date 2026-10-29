-- Courier integration (Shadowfax first): per-seller shipments, booking attempts, tracking events.
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS provider VARCHAR(20);              -- shadowfax | shiprocket | manual
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS client_order_id VARCHAR(80);       -- our idempotency key sent to the courier
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS courier_status VARCHAR(40);        -- raw courier status
-- one live shipment per (order, seller-or-Veda)
CREATE UNIQUE INDEX IF NOT EXISTS uq_shipment_group ON shipments (order_id, COALESCE(seller_id, '00000000-0000-0000-0000-000000000000'::uuid)) WHERE provider IS NOT NULL AND status <> 'cancelled';
CREATE UNIQUE INDEX IF NOT EXISTS uq_shipment_awb ON shipments (provider, awb_code) WHERE awb_code IS NOT NULL AND provider IS NOT NULL;

CREATE TABLE IF NOT EXISTS shipment_attempts (
  id               BIGSERIAL PRIMARY KEY,
  order_id         UUID NOT NULL REFERENCES orders(id),
  seller_id        UUID REFERENCES sellers(id),
  provider         VARCHAR(20) NOT NULL,
  client_order_id  VARCHAR(80) NOT NULL,
  state            VARCHAR(12) NOT NULL DEFAULT 'started',  -- started | success | failed | unknown
  awb_code         VARCHAR(60),
  error            TEXT,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_attempts_order ON shipment_attempts(order_id, created_at DESC);
-- at most one in-flight booking per group (local booking lock)
CREATE UNIQUE INDEX IF NOT EXISTS uq_attempt_inflight ON shipment_attempts (client_order_id) WHERE state = 'started';

CREATE TABLE IF NOT EXISTS tracking_events (
  id           BIGSERIAL PRIMARY KEY,
  shipment_id  UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status       VARCHAR(40) NOT NULL,
  status_text  VARCHAR(120),
  location     VARCHAR(160),
  remarks      TEXT,
  event_time   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shipment_id, status, event_time)
);
CREATE INDEX IF NOT EXISTS idx_tracking_shipment ON tracking_events(shipment_id, event_time);

CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES users(id),
  action     VARCHAR(60) NOT NULL,
  order_id   UUID REFERENCES orders(id),
  detail     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE shipment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Safety switch: real courier bookings are blocked until an admin turns "live booking" ON.
CREATE TABLE IF NOT EXISTS app_settings (
  key        VARCHAR(60) PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
