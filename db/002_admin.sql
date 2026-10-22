-- Admin panel additions. Idempotent: safe to run on every migrate.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at  TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS order_returns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reason        VARCHAR(200) NOT NULL,
  status        VARCHAR(15) NOT NULL DEFAULT 'requested',  -- requested | approved | picked_up | refunded | rejected
  refund_amount NUMERIC(10,2) CHECK (refund_amount IS NULL OR refund_amount >= 0),
  admin_note    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_returns_status ON order_returns(status, created_at DESC);

CREATE TABLE IF NOT EXISTS support_issues (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  subject    VARCHAR(160) NOT NULL,
  message    TEXT,
  priority   VARCHAR(10) NOT NULL DEFAULT 'normal',        -- low | normal | high
  status     VARCHAR(15) NOT NULL DEFAULT 'open',          -- open | in_progress | resolved
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_issues_status ON support_issues(status, created_at DESC);

-- Supabase safety: the app talks to Postgres directly (server-side only), so lock the
-- auto-generated public REST API out of every table by enabling Row Level Security with no policies.
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
