-- Platform Config — key/value store for admin-managed settings
-- Run in Supabase SQL Editor → New query → paste → Run

CREATE TABLE IF NOT EXISTS platform_config (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only service role can read/write (admin API uses service role key)
-- No RLS user policies needed

-- Seed default values (edit value to your real number before running)
INSERT INTO platform_config (key, value)
VALUES ('lytrix_wa_number', '233XXXXXXXXX')
ON CONFLICT (key) DO NOTHING;
