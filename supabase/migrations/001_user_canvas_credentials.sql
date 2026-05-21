-- Run this in the Supabase SQL editor (or via Supabase CLI) after creating your project.

create table public.user_canvas_credentials (
  user_id uuid primary key references auth.users (id) on delete cascade,
  canvas_base_url text not null,
  canvas_access_token text not null,
  auth_method text not null default 'pat' check (auth_method in ('pat', 'oauth')),
  refresh_token text,
  expires_at bigint,
  updated_at timestamptz not null default now()
);

alter table public.user_canvas_credentials enable row level security;

create policy "Users can view own credentials"
  on public.user_canvas_credentials
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own credentials"
  on public.user_canvas_credentials
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own credentials"
  on public.user_canvas_credentials
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own credentials"
  on public.user_canvas_credentials
  for delete
  using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on table public.user_canvas_credentials
  to authenticated;
