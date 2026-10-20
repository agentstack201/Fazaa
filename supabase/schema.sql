-- FAZA'A schema (PostgreSQL / PostgREST)
create table if not exists public.fazaa_requests (
  id text primary key,
  region text not null,
  incident text not null check (incident in ('breakdown','accident')),
  car text not null check (car in ('economy','sedan','suv')),
  plate text not null default '',
  phone text not null default '',
  step int not null default 1 check (step between 1 and 6),
  step_times jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.fazaa_events (
  id bigserial primary key,
  request_id text not null references public.fazaa_requests(id) on delete cascade,
  step int not null,
  at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.fazaa_regions (
  id text primary key,
  name_ar text not null,
  name_en text not null,
  hub_en text not null,
  cars int not null,
  workshops int not null,
  eta_min int not null
);

alter table public.fazaa_requests enable row level security;
alter table public.fazaa_events enable row level security;
alter table public.fazaa_regions enable row level security;

-- Demo policies: the public app may create and advance requests.
drop policy if exists "anon rw requests" on public.fazaa_requests;
create policy "anon rw requests" on public.fazaa_requests for all to anon using (true) with check (true);
drop policy if exists "anon insert events" on public.fazaa_events;
create policy "anon insert events" on public.fazaa_events for insert to anon with check (true);
drop policy if exists "anon read regions" on public.fazaa_regions;
create policy "anon read regions" on public.fazaa_regions for select to anon using (true);

alter publication supabase_realtime add table public.fazaa_requests;
