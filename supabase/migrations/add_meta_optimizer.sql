-- Meta Ads Optimizer - Database Schema
-- Feature 1: Intent-Based Funnel Templates
-- Feature 2: Qualification Scoring Engine
-- Feature 3: Campaign Health Monitoring

-- ============================================
-- Feature 1: Funnel Templates & Intent Types
-- ============================================

-- Create funnel intent enum
CREATE TYPE funnel_intent AS ENUM (
  'buyer',
  'seller',
  'renter',
  'investor',
  'custom'
);

-- Create funnel templates table
CREATE TABLE funnel_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  intent funnel_intent NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  template_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add template tracking to funnels
ALTER TABLE funnels
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES funnel_templates(id),
ADD COLUMN IF NOT EXISTS intent funnel_intent;

-- Indexes for templates
CREATE INDEX idx_funnel_templates_intent ON funnel_templates(intent);
CREATE INDEX idx_funnel_templates_system ON funnel_templates(is_system);
CREATE INDEX idx_funnels_intent ON funnels(intent) WHERE intent IS NOT NULL;

-- ============================================
-- Feature 2: Lead Qualification Scoring
-- ============================================

-- Create lead qualification scores table
CREATE TABLE lead_qualification_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Score components (0-30 for timeline, financial; 0-25 for specificity, etc.)
  timeline_score INTEGER CHECK (timeline_score BETWEEN 0 AND 30) DEFAULT 0,
  financial_ready_score INTEGER CHECK (financial_ready_score BETWEEN 0 AND 30) DEFAULT 0,
  specificity_score INTEGER CHECK (specificity_score BETWEEN 0 AND 25) DEFAULT 0,
  engagement_score INTEGER CHECK (engagement_score BETWEEN 0 AND 15) DEFAULT 0,
  response_speed_score INTEGER CHECK (response_speed_score BETWEEN 0 AND 10) DEFAULT 0,
  
  -- Total score (auto-calculated, max 100)
  total_score INTEGER GENERATED ALWAYS AS (
    COALESCE(timeline_score, 0) + 
    COALESCE(financial_ready_score, 0) + 
    COALESCE(specificity_score, 0) + 
    COALESCE(engagement_score, 0) + 
    COALESCE(response_speed_score, 0)
  ) STORED,
  
  -- Quality tier (based on total score)
  quality_tier TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN (COALESCE(timeline_score, 0) + COALESCE(financial_ready_score, 0) + 
            COALESCE(specificity_score, 0) + COALESCE(engagement_score, 0) + 
            COALESCE(response_speed_score, 0)) >= 70 THEN 'hot'
      WHEN (COALESCE(timeline_score, 0) + COALESCE(financial_ready_score, 0) + 
            COALESCE(specificity_score, 0) + COALESCE(engagement_score, 0) + 
            COALESCE(response_speed_score, 0)) >= 40 THEN 'warm'
      ELSE 'cold'
    END
  ) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for scoring
CREATE INDEX idx_lead_scores_lead ON lead_qualification_scores(lead_id);
CREATE INDEX idx_lead_scores_total ON lead_qualification_scores(total_score DESC);
CREATE INDEX idx_lead_scores_tier ON lead_qualification_scores(quality_tier);

-- ============================================
-- Feature 3: Campaign Metrics & Health
-- ============================================

-- Create campaign metrics table
CREATE TABLE campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Campaign identification (from UTM params)
  campaign_name TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  
  -- Date for metrics snapshot
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Volume metrics
  total_leads INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  noise_leads INTEGER DEFAULT 0,
  
  -- Quality metrics
  avg_qualification_score DECIMAL,
  avg_response_time_seconds INTEGER,
  
  -- Learning status tracking
  learning_status TEXT CHECK (learning_status IN ('learning', 'active', 'learning_limited')),
  events_this_week INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(client_id, campaign_name, metric_date)
);

-- Indexes for campaign metrics
CREATE INDEX idx_campaign_metrics_client ON campaign_metrics(client_id);
CREATE INDEX idx_campaign_metrics_campaign ON campaign_metrics(campaign_name);
CREATE INDEX idx_campaign_metrics_date ON campaign_metrics(metric_date DESC);
CREATE INDEX idx_campaign_metrics_learning ON campaign_metrics(learning_status) WHERE learning_status IS NOT NULL;

-- ============================================
-- Noise Tracking Enhancement
-- ============================================

-- Expand noise tag enum if not exists
DO $$ 
BEGIN
  -- Check if noise_tag type exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'noise_tag') THEN
    CREATE TYPE noise_tag AS ENUM (
      'wrong_area',
      'no_budget',
      'spam',
      'renter_not_buyer',
      'seller_not_buyer',
      'investor_not_target',
      'not_ready',
      'competitor',
      'test_message',
      'duplicate',
      'other'
    );
  END IF;
END $$;

-- Add noise tracking columns to leads table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'noise_tag'
  ) THEN
    ALTER TABLE leads 
    ADD COLUMN noise_tag noise_tag,
    ADD COLUMN noise_notes TEXT,
    ADD COLUMN is_noise BOOLEAN GENERATED ALWAYS AS (noise_tag IS NOT NULL) STORED;
  END IF;
END $$;

-- Create index for noise filtering
CREATE INDEX IF NOT EXISTS idx_leads_noise ON leads(is_noise) WHERE is_noise = TRUE;
CREATE INDEX IF NOT EXISTS idx_leads_noise_tag ON leads(noise_tag) WHERE noise_tag IS NOT NULL;

-- ============================================
-- Helper Views
-- ============================================

-- View: Campaign performance summary
CREATE OR REPLACE VIEW campaign_performance_summary AS
SELECT 
  c.id as client_id,
  c.name as client_name,
  (l.contact_data->>'utm_campaign') as campaign_name,
  (l.contact_data->>'utm_source') as utm_source,
  (l.contact_data->>'utm_medium') as utm_medium,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE lqs.quality_tier = 'hot') as hot_leads,
  COUNT(*) FILTER (WHERE lqs.quality_tier = 'warm') as warm_leads,
  COUNT(*) FILTER (WHERE lqs.quality_tier = 'cold') as cold_leads,
  COUNT(*) FILTER (WHERE l.is_noise = TRUE) as noise_leads,
  ROUND(AVG(lqs.total_score), 1) as avg_score,
  ROUND(COUNT(*) FILTER (WHERE lqs.total_score >= 70)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) as qualification_rate
FROM leads l
JOIN clients c ON l.client_id = c.id
LEFT JOIN lead_qualification_scores lqs ON l.id = lqs.lead_id
WHERE l.contact_data->>'utm_campaign' IS NOT NULL
GROUP BY c.id, c.name, campaign_name, utm_source, utm_medium;

-- View: Lead scores with lead info
CREATE OR REPLACE VIEW leads_with_scores AS
SELECT 
  l.*,
  lqs.timeline_score,
  lqs.financial_ready_score,
  lqs.specificity_score,
  lqs.engagement_score,
  lqs.response_speed_score,
  lqs.total_score,
  lqs.quality_tier
FROM leads l
LEFT JOIN lead_qualification_scores lqs ON l.id = lqs.lead_id;

-- Grant permissions
GRANT SELECT ON campaign_performance_summary TO authenticated;
GRANT SELECT ON leads_with_scores TO authenticated;
