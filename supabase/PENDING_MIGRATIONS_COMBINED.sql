-- ============================================
-- COMBINED PENDING MIGRATIONS
-- ============================================
-- Run this ONCE in Supabase SQL Editor to apply all pending fixes.

-- PHASE 1: Fix Foreign Keys for Funnels
-- Reason: Ensure funnels point to the new 'funnel_templates' table
ALTER TABLE funnels
DROP CONSTRAINT IF EXISTS funnels_template_id_fkey;

ALTER TABLE funnels
ADD CONSTRAINT funnels_template_id_fkey
FOREIGN KEY (template_id)
REFERENCES funnel_templates(id)
ON DELETE SET NULL;

-- PHASE 2: WhatsApp Integration Schema
-- Reason: Enable WhatsApp webhook features

-- 1. Add WhatsApp fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT,
ADD COLUMN IF NOT EXISTS client_whatsapp_number TEXT;

-- 2. Create whatsapp_sessions table
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lead_phone TEXT NOT NULL,
  funnel_id UUID REFERENCES funnels(id) ON DELETE SET NULL,
  current_step INTEGER DEFAULT 0,
  responses JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_lead_phone ON whatsapp_sessions(lead_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_client_id ON whatsapp_sessions(client_id);

-- 4. Add WhatsApp fields to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- DONE
SELECT 'All pending migrations applied successfully!' as status;
