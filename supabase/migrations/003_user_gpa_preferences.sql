-- Per-user GPA scale and weighting preferences (run after 001/002).

create table public.user_gpa_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_gpa_preferences enable row level security;

create policy "Users can view own gpa preferences"
  on public.user_gpa_preferences
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own gpa preferences"
  on public.user_gpa_preferences
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own gpa preferences"
  on public.user_gpa_preferences
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own gpa preferences"
  on public.user_gpa_preferences
  for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete
  on table public.user_gpa_preferences
  to authenticated;
