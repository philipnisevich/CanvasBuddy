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

export function dbSetupMessage(
  issue: DbSetupIssue,
  table: "canvas" | "gpa" | "app" = "canvas"
): string {
  if (issue === "missing_table") {
    if (table === "gpa") {
      return "GPA settings table missing. In Supabase SQL Editor, run supabase/migrations/000_setup_all.sql, then refresh and save again.";
    }
    if (table === "app") {
      return "App preferences table missing. In Supabase SQL Editor, run supabase/migrations/000_setup_all.sql, then try again.";
    }
    return "Database table missing. In Supabase SQL Editor, run supabase/migrations/000_setup_all.sql, then try again.";
  }
  if (issue === "permission_denied") {
    if (table === "gpa") {
      return "GPA table permissions missing. In Supabase SQL Editor, re-run supabase/migrations/000_setup_all.sql.";
    }
    if (table === "app") {
      return "App preferences permissions missing. Re-run supabase/migrations/000_setup_all.sql.";
    }
    return "Database permissions missing. In Supabase SQL Editor, run supabase/migrations/000_setup_all.sql, then refresh and try again.";
  }
  return "Database error. Check Supabase logs and try again.";
}
