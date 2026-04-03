-- Smart Team Handoff — add handoff_whatsapp_number column
-- Run in Supabase SQL Editor → New query → paste → Run

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS handoff_whatsapp_number TEXT;

-- logo_url was added by referral_migration — add it here too as a safety guard
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS logo_url TEXT;
