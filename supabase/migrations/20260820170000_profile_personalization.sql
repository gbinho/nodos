alter table public.profiles
  add column if not exists spotify_url text,
  add column if not exists bg_gif_url text;