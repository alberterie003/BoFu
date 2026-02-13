-- Drop the old foreign key constraint
ALTER TABLE funnels
DROP CONSTRAINT IF EXISTS funnels_template_id_fkey;

-- Add the new foreign key constraint pointing to funnel_templates
ALTER TABLE funnels
ADD CONSTRAINT funnels_template_id_fkey
FOREIGN KEY (template_id)
REFERENCES funnel_templates(id)
ON DELETE SET NULL;
