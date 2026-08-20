alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists is_suspended boolean not null default false;

update public.profiles set is_admin = true where lower(username) = 'gabriel';

create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  checkin_id uuid references public.checkins(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null check (reason in ('spam', 'ofensivo', 'inapropriado', 'outro')),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  check ((checkin_id is not null) or (comment_id is not null))
);

alter table public.reports enable row level security;
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin" on public.reports for select using (auth.uid() = reporter_id or exists (select 1 from public.profiles where id = auth.uid() and is_admin));
drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin" on public.reports for update using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles for update using (auth.uid() = id or exists (select 1 from public.profiles where id = auth.uid() and is_admin));
drop policy if exists "checkins_delete_admin" on public.checkins;
create policy "checkins_delete_admin" on public.checkins for delete using (auth.uid() = user_id or exists (select 1 from public.profiles where id = auth.uid() and is_admin));
drop policy if exists "comments_delete_admin" on public.comments;
create policy "comments_delete_admin" on public.comments for delete using (auth.uid() = user_id or exists (select 1 from public.profiles where id = auth.uid() and is_admin));