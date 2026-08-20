create table if not exists public.reactions (
  id uuid default uuid_generate_v4() primary key,
  checkin_id uuid references public.checkins(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reaction_type text not null check (reaction_type in ('inspired', 'respect', 'fire')),
  unique (checkin_id, user_id)
);

create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  checkin_id uuid references public.checkins(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(trim(content)) between 1 and 500),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists reactions_checkin_id_idx on public.reactions (checkin_id);
create index if not exists comments_checkin_id_idx on public.comments (checkin_id, created_at asc);

alter table public.reactions enable row level security;
alter table public.comments enable row level security;

drop policy if exists "reactions_select_all" on public.reactions;
create policy "reactions_select_all" on public.reactions for select using (true);
drop policy if exists "reactions_insert_own" on public.reactions;
create policy "reactions_insert_own" on public.reactions for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "reactions_update_own" on public.reactions;
create policy "reactions_update_own" on public.reactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "reactions_delete_own" on public.reactions;
create policy "reactions_delete_own" on public.reactions for delete using (auth.uid() = user_id);

drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments for select using (true);
drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments for delete using (auth.uid() = user_id);