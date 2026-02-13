-- WhatsApp Integration - Database Schema Updates
-- Add WhatsApp support to existing tables and create session tracking

-- 1. Update clients table to store Twilio numbers
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT,
ADD COLUMN IF NOT EXISTS client_whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_config JSONB DEFAULT '{}';

-- Add index for faster lookups by Twilio number
CREATE INDEX IF NOT EXISTS idx_clients_twilio_phone ON clients(twilio_phone_number);

COMMENT ON COLUMN clients.twilio_phone_number IS 'Twilio phone number assigned to this client (e.g., +13051111111)';
COMMENT ON COLUMN clients.client_whatsapp_number IS 'Client real WhatsApp number for message forwarding (e.g., +13059998888)';
COMMENT ON COLUMN clients.whatsapp_config IS 'Additional WhatsApp configuration (provider, credentials, etc.)';

-- 2. Create whatsapp_sessions table
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lead_phone TEXT NOT NULL,
  funnel_id UUID REFERENCES funnels(id) ON DELETE SET NULL,
  current_step INTEGER DEFAULT 0,
  responses JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'forwarding', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_lead_phone ON whatsapp_sessions(lead_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_client_id ON whatsapp_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_created_at ON whatsapp_sessions(created_at DESC);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_lead_client ON whatsapp_sessions(lead_phone, client_id);

COMMENT ON TABLE whatsapp_sessions IS 'Tracks WhatsApp conversation sessions for funnel completion';
COMMENT ON COLUMN whatsapp_sessions.lead_phone IS 'Lead phone number in E.164 format (e.g., +15559998888)';
COMMENT ON COLUMN whatsapp_sessions.current_step IS 'Current step index in the funnel (0-indexed)';
COMMENT ON COLUMN whatsapp_sessions.responses IS 'JSON object storing all lead responses { "name": "John", "email": "john@example.com" }';
COMMENT ON COLUMN whatsapp_sessions.status IS 'Session status: active (in funnel), completed (done but not forwarding), forwarding (all messages go to client), abandoned (timeout/stopped)';

-- 3. Update leads table for WhatsApp source tracking
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web' CHECK (source IN ('web', 'whatsapp')),
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_session_id UUID REFERENCES whatsapp_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_number ON leads(whatsapp_number);

COMMENT ON COLUMN leads.source IS 'Source of the lead: web (landing page) or whatsapp (conversation)';
COMMENT ON COLUMN leads.whatsapp_number IS 'Lead WhatsApp phone number if source=whatsapp';
COMMENT ON COLUMN leads.whatsapp_session_id IS 'Reference to the WhatsApp session that created this lead';

-- 4. Update function for session timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_whatsapp_session_timestamp
BEFORE UPDATE ON whatsapp_sessions
FOR EACH ROW
EXECUTE FUNCTION update_whatsapp_session_timestamp();
