-- Create hobby_requests table
create table if not exists public.hobby_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  hobby_name text not null,
  category text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.hobby_requests enable row level security;

-- Policies for hobby_requests
drop policy if exists "hobby_requests_insert_own" on public.hobby_requests;
create policy "hobby_requests_insert_own" on public.hobby_requests for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "hobby_requests_select_own_or_admin" on public.hobby_requests;
create policy "hobby_requests_select_own_or_admin" on public.hobby_requests for select using (auth.uid() = user_id or exists (select 1 from public.profiles where id = auth.uid() and is_admin));

drop policy if exists "hobby_requests_update_admin" on public.hobby_requests;
create policy "hobby_requests_update_admin" on public.hobby_requests for update using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- Create official_hobbies table
create table if not exists public.official_hobbies (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  slug text not null unique,
  category text not null,
  color_hex text not null default '#6b7280',
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.official_hobbies enable row level security;

-- Policies for official_hobbies
drop policy if exists "official_hobbies_select_all" on public.official_hobbies;
create policy "official_hobbies_select_all" on public.official_hobbies for select using (true);

drop policy if exists "official_hobbies_insert_admin" on public.official_hobbies;
create policy "official_hobbies_insert_admin" on public.official_hobbies for insert to authenticated with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));