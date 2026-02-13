-- ⚠️ WARNING: This will delete ALL funnels, leads, and sessions!
-- Use only if you want a fresh start.

-- 1. Delete all funnels (Cascades to leads, sessions, etc. if FKs are set correctly)
TRUNCATE TABLE funnels CASCADE;

-- 2. Drop the old foreign key constraint
ALTER TABLE funnels
DROP CONSTRAINT IF EXISTS funnels_template_id_fkey;

-- 3. Add the new foreign key constraint pointing to funnel_templates
ALTER TABLE funnels
ADD CONSTRAINT funnels_template_id_fkey
FOREIGN KEY (template_id)
REFERENCES funnel_templates(id)
ON DELETE SET NULL;
