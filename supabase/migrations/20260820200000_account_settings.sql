alter table public.profiles
  add column if not exists email_public boolean not null default false;

update public.profiles
set email_public = false
where email_public is null;