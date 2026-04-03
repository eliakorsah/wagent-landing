-- Feature Votes
-- Run in Supabase SQL Editor → New query → paste → Run

CREATE TABLE IF NOT EXISTS feature_votes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  feature_id  TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id, feature_id)
);

ALTER TABLE feature_votes ENABLE ROW LEVEL SECURITY;

-- Businesses can read all votes (to show counts) but only manage their own
CREATE POLICY "Anyone can read votes"
  ON feature_votes FOR SELECT
  USING (true);

CREATE POLICY "Businesses manage own votes"
  ON feature_votes FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_feature_votes_feature ON feature_votes (feature_id);
CREATE INDEX idx_feature_votes_business ON feature_votes (business_id);
