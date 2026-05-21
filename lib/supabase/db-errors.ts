export type DbSetupIssue = "missing_table" | "permission_denied" | "other";

export function classifyDbError(
  message: string,
  code?: string
): DbSetupIssue {
  const lower = message.toLowerCase();

  if (
    code === "PGRST205" ||
    lower.includes("schema cache") ||
    lower.includes("could not find the table")
  ) {
    return "missing_table";
  }

  if (code === "42501" || lower.includes("permission denied")) {
    return "permission_denied";
  }

  return "other";
}

export function dbSetupMessage(issue: DbSetupIssue): string {
  if (issue === "missing_table") {
    return "Database table missing. In Supabase SQL Editor, run supabase/migrations/001_user_canvas_credentials.sql, then try again.";
  }
  if (issue === "permission_denied") {
    return "Database permissions missing. In Supabase SQL Editor, run supabase/migrations/002_grants.sql, then refresh and try again.";
  }
  return "Database error. Check Supabase logs and try again.";
}
