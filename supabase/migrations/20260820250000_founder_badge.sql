create extension if not exists "uuid-ossp";

create table if not exists public.badges (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  title text not null,
  description text not null,
  icon_name text not null,
  req_type text not null check (req_type in ('checkins_count', 'total_hours', 'streak_days', 'total_xp')),
  req_value numeric not null
);

create table if not exists public.user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, badge_id)
);

insert into public.badges (slug, title, description, icon_name, req_type, req_value)
values ('founder', 'Membro Fundador', 'Um dos primeiros 50 membros da plataforma', 'crown', 'checkins_count', 0)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  icon_name = excluded.icon_name;

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "badges_select_all" on public.badges;
create policy "badges_select_all" on public.badges for select using (true);
drop policy if exists "user_badges_select_all" on public.user_badges;
create policy "user_badges_select_all" on public.user_badges for select using (true);
drop policy if exists "user_badges_insert_own" on public.user_badges;
create policy "user_badges_insert_own" on public.user_badges for insert to authenticated with check (auth.uid() = user_id);

create or replace function public.award_founder_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_count integer;
  founder_badge_id uuid;
begin
  select count(*) into profile_count from public.profiles;
  if profile_count <= 50 then
    select id into founder_badge_id from public.badges where slug = 'founder';
    insert into public.user_badges (user_id, badge_id)
    values (new.id, founder_badge_id)
    on conflict (user_id, badge_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_founder_badge on public.profiles;
create trigger profiles_founder_badge
  after insert on public.profiles
  for each row execute function public.award_founder_badge();