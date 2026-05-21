-- Run this if the table exists but you see "permission denied for table user_canvas_credentials"

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on table public.user_canvas_credentials
  to authenticated;

-- GPA preferences (after running 003_user_gpa_preferences.sql)
grant select, insert, update, delete
  on table public.user_gpa_preferences
  to authenticated;
