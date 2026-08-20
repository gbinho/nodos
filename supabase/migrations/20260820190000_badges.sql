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
values
  ('primeiros-passos', 'Primeiros Passos', 'Criou seu primeiro check-in.', 'footprints', 'checkins_count', 1),
  ('dedicado', 'Dedicado', 'Acumulou 10 horas de prática.', 'timer', 'total_hours', 10),
  ('consistente', 'Consistente', 'Manteve 7 dias seguidos de sequência.', 'flame', 'streak_days', 7),
  ('centenario', 'Centenário', 'Atingiu 500 XP acumulados.', 'trophy', 'total_xp', 500)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  icon_name = excluded.icon_name,
  req_type = excluded.req_type,
  req_value = excluded.req_value;

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "badges_select_all" on public.badges;
create policy "badges_select_all" on public.badges for select using (true);
drop policy if exists "user_badges_select_all" on public.user_badges;
create policy "user_badges_select_all" on public.user_badges for select using (true);
drop policy if exists "user_badges_insert_own" on public.user_badges;
create policy "user_badges_insert_own" on public.user_badges for insert to authenticated with check (auth.uid() = user_id);