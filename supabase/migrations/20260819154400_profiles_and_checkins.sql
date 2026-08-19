-- NODOS · schema inicial
-- Cole no SQL Editor do Supabase (Dashboard → SQL) e execute.

create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  username text unique,
  avatar_url text,
  total_xp integer default 0
);

create table if not exists public.checkins (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  hobby_tag text,
  description text,
  image_url text,
  time_invested_minutes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists checkins_user_id_idx on public.checkins (user_id);
create index if not exists checkins_created_at_idx on public.checkins (created_at desc);

-- Perfil criado automaticamente no signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.checkins enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "checkins_select_all" on public.checkins;
create policy "checkins_select_all"
  on public.checkins for select
  using (true);

drop policy if exists "checkins_insert_own" on public.checkins;
create policy "checkins_insert_own"
  on public.checkins for insert
  with check (auth.uid() = user_id);

drop policy if exists "checkins_update_own" on public.checkins;
create policy "checkins_update_own"
  on public.checkins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "checkins_delete_own" on public.checkins;
create policy "checkins_delete_own"
  on public.checkins for delete
  using (auth.uid() = user_id);
