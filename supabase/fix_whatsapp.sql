-- RUN THIS IN YOUR SUPABASE DASHBOARD SQL EDITOR
-- Link: https://supabase.com/dashboard/project/brusvpwaflmzqzjsoasf/sql

-- 1. Add missing column
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- 2. Force specific schema cache reload
NOTIFY pgrst, 'reload config';

-- 3. Verify
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name = 'whatsapp_number';
