-- StyleOS production bootstrap contract for Supabase / PostgreSQL.
-- Apply to a new project only. Future changes must use versioned migrations.

begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  memory_version integer not null default 2 check (memory_version > 0),
  profile_revision bigint not null default 0 check (profile_revision >= 0),
  setup_completed boolean not null default false,
  monthly_budget numeric(12, 2) not null default 1200 check (monthly_budget >= 0),
  scenes jsonb not null default '[]'::jsonb check (jsonb_typeof(scenes) = 'array'),
  expression_goal text not null default '' check (char_length(expression_goal) <= 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.style_memory_records (
  id text not null check (char_length(id) between 1 and 600),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null check (char_length(domain) between 1 and 80),
  kind text not null check (char_length(kind) between 1 and 80),
  value text not null check (char_length(value) between 1 and 600),
  label text not null check (char_length(label) between 1 and 600),
  confidence numeric(4, 3) not null check (confidence >= 0.05 and confidence <= 0.99),
  evidence_count integer not null default 1 check (evidence_count >= 1),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  confirmed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.decision_runs (
  id text not null check (char_length(id) between 1 and 600),
  user_id uuid not null references auth.users(id) on delete cascade,
  product jsonb not null check (jsonb_typeof(product) = 'object'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  status text not null default 'advised' check (status in ('advised', 'watching', 'purchased', 'passed', 'kept', 'returned')),
  outcome jsonb check (outcome is null or jsonb_typeof(outcome) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.image_assets (
  id text not null check (char_length(id) between 1 and 600),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('profile', 'product', 'wardrobe')),
  storage_path text not null check (char_length(storage_path) between 1 and 1000),
  processing_status text not null default 'uploaded' check (processing_status in ('uploaded', 'processing', 'ready', 'failed', 'deleted')),
  extraction jsonb check (extraction is null or jsonb_typeof(extraction) = 'object'),
  consent_version text not null check (char_length(consent_version) between 1 and 80),
  retention_until timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.wardrobe_items (
  id text not null check (char_length(id) between 1 and 600),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 600),
  category text not null check (category in ('tops', 'bottoms', 'outerwear', 'shoes', 'accessories')),
  color text not null check (char_length(color) between 1 and 80),
  fit text not null check (char_length(fit) between 1 and 80),
  scenes jsonb not null default '[]'::jsonb check (jsonb_typeof(scenes) = 'array'),
  wear_frequency text not null default 'monthly' check (wear_frequency in ('weekly', 'monthly', 'rare', 'unused')),
  status text not null default 'active' check (status in ('active', 'idle', 'retired')),
  liked boolean not null default true,
  notes text not null default '' check (char_length(notes) <= 600),
  image_asset_id text,
  source_decision_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, image_asset_id) references public.image_assets(user_id, id) deferrable initially deferred,
  foreign key (user_id, source_decision_id) references public.decision_runs(user_id, id) deferrable initially deferred
);

create index if not exists style_memory_user_updated_idx on public.style_memory_records (user_id, updated_at desc);
create index if not exists wardrobe_user_updated_idx on public.wardrobe_items (user_id, updated_at desc);
create index if not exists decisions_user_updated_idx on public.decision_runs (user_id, updated_at desc);
create index if not exists images_user_created_idx on public.image_assets (user_id, created_at desc);
create index if not exists images_retention_idx on public.image_assets (retention_until) where deleted_at is null;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists memory_set_updated_at on public.style_memory_records;
create trigger memory_set_updated_at before update on public.style_memory_records for each row execute function public.set_updated_at();
drop trigger if exists wardrobe_set_updated_at on public.wardrobe_items;
create trigger wardrobe_set_updated_at before update on public.wardrobe_items for each row execute function public.set_updated_at();
drop trigger if exists decisions_set_updated_at on public.decision_runs;
create trigger decisions_set_updated_at before update on public.decision_runs for each row execute function public.set_updated_at();
drop trigger if exists images_set_updated_at on public.image_assets;
create trigger images_set_updated_at before update on public.image_assets for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.style_memory_records enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.decision_runs enable row level security;
alter table public.image_assets enable row level security;

drop policy if exists "Users manage only their own profile" on public.profiles;
create policy "Users manage only their own profile" on public.profiles
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users read only their own derived memory" on public.style_memory_records;
drop policy if exists "Users manage only their own memory" on public.style_memory_records;
create policy "Users read only their own derived memory" on public.style_memory_records
  for select using ((select auth.uid()) = user_id);

drop policy if exists "Users manage only their own wardrobe" on public.wardrobe_items;
create policy "Users manage only their own wardrobe" on public.wardrobe_items
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users read only their own decisions" on public.decision_runs;
drop policy if exists "Users manage only their own decisions" on public.decision_runs;
create policy "Users read only their own decisions" on public.decision_runs
  for select using ((select auth.uid()) = user_id);

drop policy if exists "Users read only their own image metadata" on public.image_assets;
drop policy if exists "Users manage only their own images" on public.image_assets;
create policy "Users read only their own image metadata" on public.image_assets
  for select using ((select auth.uid()) = user_id);

commit;
