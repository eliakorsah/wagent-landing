# Supabase Migrations — Run Order

Run these SQL files in Supabase → SQL Editor → New query, in this order:

1. `schema.sql` — base tables (businesses, conversations, messages, faqs, training_docs, doc_embeddings, team_members, discount_codes)
2. `referral_migration.sql` — adds referral_code, referred_by, referred_count, logo_url columns + trigger
3. `feature_votes_migration.sql` — creates feature_votes table
4. `storage_buckets.sql` — creates business-logos storage bucket + RLS policies
5. `handoff_migration.sql` — adds handoff_whatsapp_number, logo_url (safe guard) columns
6. `platform_config_migration.sql` — creates platform_config table + seeds lytrix_wa_number

After running #6, go to Admin Console → Platform tab and set your real LYTRIX WhatsApp number.
