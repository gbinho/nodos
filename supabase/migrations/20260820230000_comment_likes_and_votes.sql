alter table public.comments
  add column if not exists edited_at timestamp with time zone,
  add column if not exists edit_count integer not null default 0;

create table if not exists public.comment_reactions (
  id uuid default uuid_generate_v4() primary key,
  comment_id uuid references public.comments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reaction_type text not null default 'like' check (reaction_type = 'like'),
  unique (comment_id, user_id)
);

create table if not exists public.checkin_votes (
  id uuid default uuid_generate_v4() primary key,
  checkin_id uuid references public.checkins(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  vote_type text not null check (vote_type in ('up', 'down')),
  unique (checkin_id, user_id)
);

alter table public.comment_reactions enable row level security;
alter table public.checkin_votes enable row level security;

create or replace function public.prevent_comment_reedit()
returns trigger
language plpgsql
as $$
begin
  if old.edit_count >= 1 then
    raise exception 'comment_can_only_be_edited_once';
  end if;
  new.edit_count := 1;
  new.edited_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists comments_single_edit on public.comments;
create trigger comments_single_edit
  before update of content on public.comments
  for each row execute function public.prevent_comment_reedit();

drop policy if exists "comment_reactions_select_all" on public.comment_reactions;
create policy "comment_reactions_select_all" on public.comment_reactions for select using (true);
drop policy if exists "comment_reactions_insert_own" on public.comment_reactions;
create policy "comment_reactions_insert_own" on public.comment_reactions for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "comment_reactions_delete_own" on public.comment_reactions;
create policy "comment_reactions_delete_own" on public.comment_reactions for delete using (auth.uid() = user_id);

drop policy if exists "checkin_votes_select_all" on public.checkin_votes;
create policy "checkin_votes_select_all" on public.checkin_votes for select using (true);
drop policy if exists "checkin_votes_insert_own" on public.checkin_votes;
create policy "checkin_votes_insert_own" on public.checkin_votes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "checkin_votes_delete_own" on public.checkin_votes;
create policy "checkin_votes_delete_own" on public.checkin_votes for delete using (auth.uid() = user_id);