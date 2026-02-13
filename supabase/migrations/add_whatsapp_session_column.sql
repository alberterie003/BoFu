-- ============================================
-- ADD WHATSAPP SESSION LINK
-- ============================================

-- 1. Add whatsapp_session_id to leads
-- This links the final lead result to the chat session that created it.
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS whatsapp_session_id UUID REFERENCES whatsapp_sessions(id) ON DELETE SET NULL;

-- 2. Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_session ON leads(whatsapp_session_id);
