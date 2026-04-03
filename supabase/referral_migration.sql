-- =============================================================================
-- Referral System Migration
-- Run this in the Supabase SQL editor or via the Supabase CLI.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add referral columns to the businesses table
-- -----------------------------------------------------------------------------

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS referral_code           TEXT    UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by             TEXT,
  ADD COLUMN IF NOT EXISTS referred_count          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_reward_claimed BOOLEAN DEFAULT false;

-- -----------------------------------------------------------------------------
-- 2. Profile picture / logo support
-- -----------------------------------------------------------------------------

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- -----------------------------------------------------------------------------
-- 3. Trigger function: auto-generate a referral code on INSERT
--    Format: WAG-XXXXXX  (6 random uppercase alphanumeric characters)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code :=
      'WAG-' ||
      UPPER(
        SUBSTRING(
          REPLACE(gen_random_uuid()::TEXT, '-', ''),
          1,
          6
        )
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger first so this script is safely re-runnable
DROP TRIGGER IF EXISTS set_referral_code ON businesses;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- -----------------------------------------------------------------------------
-- 4. Back-fill referral codes for businesses that were created before this
--    migration ran (trigger only fires on new inserts).
-- -----------------------------------------------------------------------------

UPDATE businesses
SET referral_code =
  'WAG-' ||
  UPPER(
    SUBSTRING(
      REPLACE(gen_random_uuid()::TEXT, '-', ''),
      1,
      6
    )
  )
WHERE referral_code IS NULL;

-- -----------------------------------------------------------------------------
-- 5. Optional index — speeds up lookups when applying a referral code
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_businesses_referral_code
  ON businesses (referral_code);

-- =============================================================================
-- End of migration
-- =============================================================================
