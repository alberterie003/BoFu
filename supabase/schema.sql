-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ROLES & ACCOUNTS
create type account_type as enum ('agency', 'solo_business');

create table public.accounts (
  id uuid primary key default uuid_generate_v4(),
  type account_type not null default 'solo_business',
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.account_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  role text default 'owner',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CLIENTS (Only for Agency mode, or hidden for Solo)
create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(account_id, slug)
);

-- TEMPLATES
create table public.templates (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  name text not null,
  spec jsonb not null default '{}'::jsonb, -- JSON defining steps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FUNNELS
create table public.funnels (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  template_id uuid not null references public.templates(id),
  name text not null,
  slug text not null,
  config jsonb not null default '{}'::jsonb, -- Overrides/Settings
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(client_id, slug)
);

-- FUNNEL SESSIONS (Anonymous users)
create type session_status as enum ('started', 'completed');

create table public.funnel_sessions (
  id uuid primary key default uuid_generate_v4(),
  funnel_id uuid not null references public.funnels(id) on delete cascade,
  session_token uuid unique default uuid_generate_v4(),
  step_progress int default 0,
  answers jsonb default '{}'::jsonb,
  status session_status default 'started',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- LEADS
create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  funnel_id uuid not null references public.funnels(id) on delete cascade,
  session_id uuid unique references public.funnel_sessions(id),
  contact_data jsonb not null, -- { name, email, phone }
  status text default 'new',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  lead_id uuid references public.leads(id),
  type text not null, -- 'new_lead'
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES
alter table public.accounts enable row level security;
alter table public.account_members enable row level security;
alter table public.clients enable row level security;
alter table public.templates enable row level security;
alter table public.funnels enable row level security;
alter table public.funnel_sessions enable row level security;
alter table public.leads enable row level security;
alter table public.notifications enable row level security;

-- Authenticated Users Policies (Dashboard)

-- Account Members: Users can view their own membership
create policy "Users can view own membership" on public.account_members
  for select using (
    auth.uid() = user_id
  );

-- Accounts: Members can view their account
create policy "Users can view own account" on public.accounts
  for select using (
    auth.uid() in (select user_id from public.account_members where account_id = id)
  );

-- Clients: Members can view clients of their account
create policy "Users can view clients" on public.clients
  for select using (
    auth.uid() in (
      select user_id from public.account_members where account_id = public.clients.account_id
    )
  );
  
create policy "Users can insert clients" on public.clients
  for insert with check (
    auth.uid() in (
      select user_id from public.account_members where account_id = public.clients.account_id
    )
  );

-- Funnels: Members can view/manage funnels
create policy "Users can view funnels" on public.funnels
  for select using (
    exists (
      select 1 from public.clients c
      join public.account_members am on am.account_id = c.account_id
      where c.id = public.funnels.client_id
      and am.user_id = auth.uid()
    )
  );

create policy "Users can update funnels" on public.funnels
  for update using (
    exists (
      select 1 from public.clients c
      join public.account_members am on am.account_id = c.account_id
      where c.id = public.funnels.client_id
      and am.user_id = auth.uid()
    )
  );

create policy "Users can insert funnels" on public.funnels
  for insert with check (
    exists (
      select 1 from public.clients c
      join public.account_members am on am.account_id = c.account_id
      where c.id = public.funnels.client_id
      and am.user_id = auth.uid()
    )
  );

-- Leads: Members can view leads
create policy "Users can view leads" on public.leads
  for select using (
    exists (
      select 1 from public.funnels f
      join public.clients c on c.id = f.client_id
      join public.account_members am on am.account_id = c.account_id
      where f.id = public.leads.funnel_id
      and am.user_id = auth.uid()
    )
  );

-- Public Access (via Service Role API mostly, but if using client lib):
-- No public RLS required if using Service Role in API Routes as planned.
-- Keeping tables private enforces security.
