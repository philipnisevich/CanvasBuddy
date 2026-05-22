-- Per-user app preferences (home layout, upcoming horizon). Run after 001–003.

create table public.user_app_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_app_preferences enable row level security;

create policy "Users can view own app preferences"
  on public.user_app_preferences
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own app preferences"
  on public.user_app_preferences
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own app preferences"
  on public.user_app_preferences
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own app preferences"
  on public.user_app_preferences
  for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete
  on table public.user_app_preferences
  to authenticated;
