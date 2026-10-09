-- Sigma Pack database schema — migration 001 (idempotent)
-- Run against Neon Postgres. Uses pgcrypto for gen_random_uuid().

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------- admins
CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- buyers
CREATE TABLE IF NOT EXISTS buyers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- plans
CREATE TABLE IF NOT EXISTS plans (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug      TEXT NOT NULL UNIQUE,
  name      TEXT NOT NULL,
  months    INTEGER NOT NULL,
  price_pkr INTEGER NOT NULL,
  features  JSONB NOT NULL DEFAULT '[]',
  active    BOOLEAN NOT NULL DEFAULT true,
  sort      INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------- tools
CREATE TABLE IF NOT EXISTS tools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  category    TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon_svg    TEXT NOT NULL DEFAULT '',
  url         TEXT NOT NULL DEFAULT '',
  active      BOOLEAN NOT NULL DEFAULT true,
  sort        INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------- orders (subscriptions)
CREATE TABLE IF NOT EXISTS orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id    UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  plan_id     UUID NOT NULL REFERENCES plans(id),
  months      INTEGER NOT NULL,
  price_pkr   INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','active','expired','cancelled')),
  payment_note TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer  ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- --------------------------------------------- tool_credentials (encrypted)
CREATE TABLE IF NOT EXISTS tool_credentials (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id      UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  buyer_id     UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  label        TEXT NOT NULL DEFAULT '',
  username_enc TEXT NOT NULL,
  password_enc TEXT NOT NULL,
  notes_enc    TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tool_id, buyer_id)
);
CREATE INDEX IF NOT EXISTS idx_creds_buyer ON tool_credentials(buyer_id);

-- ---------------------------------------------------------------- settings (single row, id=1)
CREATE TABLE IF NOT EXISTS settings (
  id               INTEGER PRIMARY KEY,
  site_name        TEXT NOT NULL DEFAULT 'Sigma Pack',
  whatsapp_number  TEXT NOT NULL DEFAULT '',
  jazzcash_number  TEXT NOT NULL DEFAULT '',
  easypaisa_number TEXT NOT NULL DEFAULT '',
  support_text     TEXT NOT NULL DEFAULT 'Need help? Message us on WhatsApp and our team will assist you.'
);
INSERT INTO settings (id)
  SELECT 1
  WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);

-- ---------------------------------------------------------------- audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT NOT NULL,
  actor_id   TEXT NOT NULL DEFAULT '',
  action     TEXT NOT NULL,
  detail     TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
