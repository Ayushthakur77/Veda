CREATE SEQUENCE IF NOT EXISTS order_no_seq START 100001;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_restored BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_pending ON orders(created_at) WHERE payment_status = 'pending' AND status = 'placed';
