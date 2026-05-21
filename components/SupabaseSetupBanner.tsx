"use client";

const SETUP_SQL_CANVAS_TABLE = `-- Step 1: Canvas credentials (skip if you already ran this)
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

create policy "Users can view own credentials"
  on public.user_canvas_credentials for select
  using (auth.uid() = user_id);

create policy "Users can insert own credentials"
  on public.user_canvas_credentials for insert
  with check (auth.uid() = user_id);

create policy "Users can update own credentials"
  on public.user_canvas_credentials for update
  using (auth.uid() = user_id);

create policy "Users can delete own credentials"
  on public.user_canvas_credentials for delete
  using (auth.uid() = user_id);`;

const SETUP_SQL_CANVAS_GRANTS = `-- Canvas table permissions (run if you see "permission denied")
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on table public.user_canvas_credentials
  to authenticated;`;

const SETUP_SQL_GPA_TABLE = `-- GPA preferences table (required for saving GPA settings)
create table if not exists public.user_gpa_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_gpa_preferences enable row level security;

create policy "Users can view own gpa preferences"
  on public.user_gpa_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own gpa preferences"
  on public.user_gpa_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own gpa preferences"
  on public.user_gpa_preferences for update
  using (auth.uid() = user_id);

create policy "Users can delete own gpa preferences"
  on public.user_gpa_preferences for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete
  on table public.user_gpa_preferences
  to authenticated;`;

const SETUP_SQL_GPA_GRANTS = `-- GPA table permissions only (if table exists but save fails)
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on table public.user_gpa_preferences
  to authenticated;`;

type SetupIssue = "missing_table" | "permission_denied" | "unknown";

export default function SupabaseSetupBanner({
  issue = "unknown",
  target = "canvas",
}: {
  issue?: SetupIssue;
  target?: "canvas" | "gpa";
}) {
  const showGrants = issue === "permission_denied";
  const sql =
    target === "gpa"
      ? showGrants
        ? SETUP_SQL_GPA_GRANTS
        : SETUP_SQL_GPA_TABLE
      : showGrants
        ? SETUP_SQL_CANVAS_GRANTS
        : SETUP_SQL_CANVAS_TABLE;

  const title =
    target === "gpa"
      ? showGrants
        ? "GPA database permissions required"
        : "GPA settings need a one-time database setup"
      : showGrants
        ? "Database permissions required"
        : "One-time database setup required";

  const description =
    target === "gpa"
      ? showGrants
        ? "The GPA table exists but authenticated users cannot write to it yet. Run the SQL below in Supabase."
        : "Create the GPA preferences table in Supabase before saving your scale and weighting."
      : showGrants
        ? "The table exists but authenticated users cannot write to it yet. Run the SQL below in Supabase."
        : "Create the credentials table in Supabase before saving your Canvas token.";

  const step3 =
    target === "gpa"
      ? "Refresh this page and save your GPA settings again."
      : "Refresh this page and save your Canvas token again.";

  return (
    <div
      role="alert"
      className="cb-card mb-6 border-[var(--warning)] bg-[var(--warning-soft)] px-4 py-4 text-sm font-medium text-[#854d0e]"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-2">{description}</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>
          Open{" "}
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            Supabase
          </a>{" "}
          → <strong>SQL Editor</strong> → <strong>New query</strong>.
        </li>
        <li>
          Paste the SQL below and click <strong>Run</strong>
          {showGrants || target === "gpa"
            ? "."
            : ", then run Step 2 grants if save still fails."}
        </li>
        <li>{step3}</li>
      </ol>
      {target === "canvas" && !showGrants && (
        <p className="mt-2 text-xs text-[#854d0e]">
          If you already created the table, run only Step 2 (grants) from{" "}
          <code className="font-mono">002_grants.sql</code>.
        </p>
      )}
      {target === "gpa" && !showGrants && (
        <p className="mt-2 text-xs text-[#854d0e]">
          This matches{" "}
          <code className="font-mono">003_user_gpa_preferences.sql</code> in
          the repo.
        </p>
      )}
      <pre className="mt-3 max-h-48 overflow-auto rounded-[var(--radius)] border-[3px] border-[var(--border)] bg-[var(--card)] p-3 font-mono text-xs text-[var(--color-text)]">
        {sql}
      </pre>
      <button
        type="button"
        className="cb-btn-secondary mt-3 cursor-pointer px-3 py-1.5 text-xs"
        onClick={() => navigator.clipboard.writeText(sql)}
      >
        Copy SQL to clipboard
      </button>
    </div>
  );
}
