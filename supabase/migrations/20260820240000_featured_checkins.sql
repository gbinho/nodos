alter table public.checkins
  add column if not exists is_featured boolean not null default false;

create or replace function public.limit_featured_checkins()
returns trigger
language plpgsql
as $$
begin
  if new.is_featured and not old.is_featured then
    if (select count(*) from public.checkins where user_id = new.user_id and is_featured) >= 3 then
      raise exception 'featured_checkins_limit_reached';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists checkins_featured_limit on public.checkins;
create trigger checkins_featured_limit
  before update of is_featured on public.checkins
  for each row execute function public.limit_featured_checkins();

create index if not exists checkins_featured_idx on public.checkins (user_id, is_featured) where is_featured = true;