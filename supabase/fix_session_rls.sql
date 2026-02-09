-- Enable RLS for funnel_sessions if not already (it is)
alter table public.funnel_sessions enable row level security;

-- Policy: Authenticated users can view sessions for funnels they own
create policy "Users can view funnel sessions" on public.funnel_sessions
  for select using (
    exists (
      select 1 from public.funnels f
      join public.clients c on c.id = f.client_id
      join public.account_members am on am.account_id = c.account_id
      where f.id = public.funnel_sessions.funnel_id
      and am.user_id = auth.uid()
    )
  );

-- Reload schema cache to ensure Next.js sees the change immediately
NOTIFY pgrst, 'reload config';
