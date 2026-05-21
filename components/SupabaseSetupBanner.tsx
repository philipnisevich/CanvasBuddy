"use client";

const SETUP_SQL_TABLE = `-- Step 1: Create table + RLS (skip if you already ran this)
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

const SETUP_SQL_GRANTS = `-- Step 2: Required permissions (run this if you see "permission denied")
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on table public.user_canvas_credentials
  to authenticated;`;

type SetupIssue = "missing_table" | "permission_denied" | "unknown";

export default function SupabaseSetupBanner({
  issue = "unknown",
}: {
  issue?: SetupIssue;
}) {
  const showGrants = issue === "permission_denied";
  const sql = showGrants ? SETUP_SQL_GRANTS : SETUP_SQL_TABLE;

  return (
    <div
      role="alert"
      className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <p className="font-semibold">
        {showGrants
          ? "Database permissions required"
          : "One-time database setup required"}
      </p>
      <p className="mt-2">
        {showGrants
          ? "The table exists but authenticated users cannot write to it yet. Run the SQL below in Supabase."
          : "Create the credentials table in Supabase before saving your Canvas token."}
      </p>
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
          {showGrants ? "" : ", then run Step 2 grants if save still fails"}.
        </li>
        <li>Refresh this page and save your Canvas token again.</li>
      </ol>
      {!showGrants && (
        <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
          If you already created the table, run only Step 2 (grants) from{" "}
          <code className="font-mono">002_grants.sql</code>.
        </p>
      )}
      <pre className="mt-3 max-h-48 overflow-auto rounded border border-amber-200 bg-white p-3 font-mono text-xs dark:border-amber-800 dark:bg-slate-900">
        {sql}
      </pre>
      <button
        type="button"
        className="mt-3 rounded-lg border border-amber-400 px-3 py-1.5 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50"
        onClick={() => navigator.clipboard.writeText(sql)}
      >
        Copy SQL to clipboard
      </button>
    </div>
  );
}
