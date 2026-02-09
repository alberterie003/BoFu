-- RUN THIS IN YOUR SUPABASE DASHBOARD SQL EDITOR
-- Link: https://supabase.com/dashboard/project/brusvpwaflmzqzjsoasf/sql

-- 1. Add temperature column to leads (if missing)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS temperature text CHECK (temperature IN ('cold', 'warm', 'hot'));

-- 2. Create Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    type text NOT NULL,
    is_read boolean DEFAULT false
);

-- 3. Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Users can view notifications for their account
CREATE POLICY "Users can view notifications for their account" ON public.notifications
    FOR SELECT
    USING (
        account_id IN (
            SELECT account_id FROM public.account_members WHERE user_id = auth.uid()
        )
    );

-- 5. Force schema cache refresh
NOTIFY pgrst, 'reload config';
