-- ============================================
-- ADD CAPI SIGNAL COLUMNS
-- ============================================

-- 1. Add Qualification Status
-- Instead of just 'status', we want a specific label for the quality.
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS qualification_label TEXT DEFAULT 'new'; 
-- Values: 'new', 'qualified', 'junk', 'no_budget', 'wrong_area'

-- 2. Add CAPI Sync Tracking
-- We need to know IF and WHEN we sent the signal to Meta.
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS capi_event_id TEXT, -- To deduplicate events if retried
ADD COLUMN IF NOT EXISTS capi_synced_at TIMESTAMP WITH TIME ZONE;

-- 3. Index for performance (finding un-synced qualified leads)
CREATE INDEX IF NOT EXISTS idx_leads_qualification_label ON leads(qualification_label);
CREATE INDEX IF NOT EXISTS idx_leads_capi_synced_at ON leads(capi_synced_at);

-- 4. Audit Log (Optional but good)
COMMENT ON COLUMN leads.capi_synced_at IS 'Timestamp when the QualifiedLead event was successfully sent to Meta CAPI';
