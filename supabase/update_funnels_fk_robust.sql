-- 1. First, clean up existing data
-- Set template_id to NULL for any funnel where the template_id 
-- does NOT exist in the new funnel_templates table
UPDATE funnels
SET template_id = NULL
WHERE template_id IS NOT NULL 
AND template_id NOT IN (SELECT id FROM funnel_templates);

-- 2. Drop the old foreign key constraint if it exists
ALTER TABLE funnels
DROP CONSTRAINT IF EXISTS funnels_template_id_fkey;

-- 3. Add the new foreign key constraint pointing to funnel_templates
ALTER TABLE funnels
ADD CONSTRAINT funnels_template_id_fkey
FOREIGN KEY (template_id)
REFERENCES funnel_templates(id)
ON DELETE SET NULL;
