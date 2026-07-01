-- CanvasBuddy — full schema setup in one idempotent script.
-- Safe to paste into the Supabase SQL editor any number of times: it creates
-- only what's missing and re-applies all policies/grants. Supersedes running

-- ── 001: user_canvas_credentials ─────────────────────────────
create table if not exists public.user_canvas_credentials (
  user_id uuid primary key references auth.users (id) on delete cascade,
  canvas_base_url text not null,
  canvas_access_token text not null,
  auth_method text not null default 'pat' check (auth_method in ('pat', 'oauth')),
  refresh_token text,
  expires_at bigint,
  updated_at timestamptz not null default now()
);
alter table public.user_canvas_credentials enable row level security;

drop policy if exists "Users can view own credentials"   on public.user_canvas_credentials;
drop policy if exists "Users can insert own credentials" on public.user_canvas_credentials;
drop policy if exists "Users can update own credentials" on public.user_canvas_credentials;
drop policy if exists "Users can delete own credentials" on public.user_canvas_credentials;

create policy "Users can view own credentials"   on public.user_canvas_credentials for select using (auth.uid() = user_id);
create policy "Users can insert own credentials" on public.user_canvas_credentials for insert with check (auth.uid() = user_id);
create policy "Users can update own credentials" on public.user_canvas_credentials for update using (auth.uid() = user_id);
create policy "Users can delete own credentials" on public.user_canvas_credentials for delete using (auth.uid() = user_id);

-- ── 003: user_gpa_preferences ────────────────────────────────
create table if not exists public.user_gpa_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_gpa_preferences enable row level security;

drop policy if exists "Users can view own gpa preferences"   on public.user_gpa_preferences;
drop policy if exists "Users can insert own gpa preferences" on public.user_gpa_preferences;
drop policy if exists "Users can update own gpa preferences" on public.user_gpa_preferences;
drop policy if exists "Users can delete own gpa preferences" on public.user_gpa_preferences;

create policy "Users can view own gpa preferences"   on public.user_gpa_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own gpa preferences" on public.user_gpa_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own gpa preferences" on public.user_gpa_preferences for update using (auth.uid() = user_id);
create policy "Users can delete own gpa preferences" on public.user_gpa_preferences for delete using (auth.uid() = user_id);

-- ── 004: user_app_preferences ────────────────────────────────
create table if not exists public.user_app_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_app_preferences enable row level security;

drop policy if exists "Users can view own app preferences"   on public.user_app_preferences;
drop policy if exists "Users can insert own app preferences" on public.user_app_preferences;
drop policy if exists "Users can update own app preferences" on public.user_app_preferences;
drop policy if exists "Users can delete own app preferences" on public.user_app_preferences;

create policy "Users can view own app preferences"   on public.user_app_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own app preferences" on public.user_app_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own app preferences" on public.user_app_preferences for update using (auth.uid() = user_id);
create policy "Users can delete own app preferences" on public.user_app_preferences for delete using (auth.uid() = user_id);

-- ── 002: grants (run last, after all tables exist) ───────────
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.user_canvas_credentials to authenticated;
grant select, insert, update, delete on table public.user_gpa_preferences   to authenticated;
grant select, insert, update, delete on table public.user_app_preferences   to authenticated;
