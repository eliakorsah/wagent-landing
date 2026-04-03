-- WAgenT Database Schema
-- Run this entire file in your Supabase SQL Editor
-- Dashboard → SQL Editor → New query → paste → Run

-- Enable pgvector for RAG (vector similarity search)
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────────────────────────────────────
-- BUSINESSES
-- One row per WAgenT customer (business owner)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE businesses (
  id                            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name                          TEXT NOT NULL,
  industry                      TEXT,
  phone_number_id               TEXT,
  whatsapp_business_account_id  TEXT,
  whatsapp_access_token         TEXT,
  whatsapp_verify_token         TEXT,
  groq_api_key                  TEXT,
  elevenlabs_api_key            TEXT,
  custom_instructions           TEXT,
  auto_reply                    BOOLEAN DEFAULT true,
  voice_enabled                 BOOLEAN DEFAULT false,
  handoff_enabled               BOOLEAN DEFAULT true,
  reply_delay_seconds           INTEGER DEFAULT 2,
  reply_tone                    TEXT DEFAULT 'professional',
  plan                          TEXT DEFAULT 'trial'
                                  CHECK (plan IN ('trial','starter','growth','business')),
  plan_expires_at               TIMESTAMPTZ,
  paystack_customer_code        TEXT,
  created_at                    TIMESTAMPTZ DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- CONVERSATIONS
-- One row per unique customer ↔ business WhatsApp thread
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE conversations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id     UUID REFERENCES businesses(id) ON DELETE CASCADE,
  customer_phone  TEXT NOT NULL,
  customer_name   TEXT,
  status          TEXT DEFAULT 'ai_active'
                    CHECK (status IN ('ai_active','manual','resolved','needs_human')),
  last_message    TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count    INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- MESSAGES
-- Every individual message in every conversation
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE messages (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id     UUID REFERENCES conversations(id) ON DELETE CASCADE,
  business_id         UUID REFERENCES businesses(id) ON DELETE CASCADE,
  from_role           TEXT NOT NULL
                        CHECK (from_role IN ('customer','ai','staff')),
  message_type        TEXT DEFAULT 'text'
                        CHECK (message_type IN ('text','audio','image','document')),
  content             TEXT,
  audio_url           TEXT,
  whatsapp_message_id TEXT,
  status              TEXT DEFAULT 'sent'
                        CHECK (status IN ('sent','delivered','read','failed')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRAINING DOCUMENTS
-- Files uploaded by the business to train their AI
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE training_docs (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id       UUID REFERENCES businesses(id) ON DELETE CASCADE,
  filename          TEXT NOT NULL,
  file_url          TEXT,
  file_size         INTEGER,
  content_text      TEXT,
  processing_status TEXT DEFAULT 'queued'
                      CHECK (processing_status IN ('queued','processing','trained','failed')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- FAQS
-- Question/answer pairs for AI training
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE faqs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- DOCUMENT EMBEDDINGS
-- Chunked text + vector embeddings for RAG retrieval
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE doc_embeddings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  doc_id      UUID REFERENCES training_docs(id) ON DELETE CASCADE,
  chunk_text  TEXT NOT NULL,
  embedding   vector(1536),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity index for fast RAG queries
CREATE INDEX ON doc_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ─────────────────────────────────────────────────────────────────────────────
-- TEAM MEMBERS
-- Staff who can access the Live Chats dashboard
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE team_members (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT DEFAULT 'agent'
                CHECK (role IN ('owner','admin','agent')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES (performance)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_conversations_business_time
  ON conversations (business_id, last_message_at DESC);

CREATE INDEX idx_messages_conversation
  ON messages (conversation_id, created_at);

CREATE INDEX idx_messages_business_time
  ON messages (business_id, created_at DESC);

CREATE INDEX idx_training_docs_business
  ON training_docs (business_id);

CREATE INDEX idx_faqs_business
  ON faqs (business_id, display_order);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Each user can only see their own business data
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE businesses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members  ENABLE ROW LEVEL SECURITY;

-- Businesses: users see only their own row
CREATE POLICY "Users see own business"
  ON businesses FOR ALL
  USING (user_id = auth.uid());

-- Conversations: visible to business owner
CREATE POLICY "Business members see conversations"
  ON conversations FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Messages: visible to business owner
CREATE POLICY "Business members see messages"
  ON messages FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Training docs: visible to business owner
CREATE POLICY "Business members see docs"
  ON training_docs FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- FAQs: visible to business owner
CREATE POLICY "Business members see faqs"
  ON faqs FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Embeddings: visible to business owner
CREATE POLICY "Business members see embeddings"
  ON doc_embeddings FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Team members: visible to business owner
CREATE POLICY "Business members see team"
  ON team_members FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- SERVICE ROLE BYPASS (for the webhook server)
-- The webhook API uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS —
-- no additional policies needed for server-side operations.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- DISCOUNT CODES
-- Generated by LYTRIX CONSULT admins, redeemed by customers at checkout
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE discount_codes (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code             TEXT NOT NULL UNIQUE,
  discount_type    TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value   NUMERIC NOT NULL CHECK (discount_value > 0),
  applies_to_plan  TEXT CHECK (applies_to_plan IN ('starter','growth','business')),
  max_uses         INTEGER,
  uses_count       INTEGER DEFAULT 0,
  expires_at       TIMESTAMPTZ,
  description      TEXT,
  is_active        BOOLEAN DEFAULT true,
  created_by       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Only service role (admin API) can read/write discount codes — no RLS user access
-- Customers submit a code at checkout; the server validates it via service role key

-- Index for fast code lookups at checkout
CREATE INDEX idx_discount_codes_code ON discount_codes (code) WHERE is_active = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- Run these separately if needed, or create via Supabase Dashboard
-- ─────────────────────────────────────────────────────────────────────────────
-- INSERT INTO storage.buckets (id, name, public) VALUES ('training-docs', 'training-docs', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('voice-messages', 'voice-messages', true);
