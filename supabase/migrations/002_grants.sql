-- Run this if the table exists but you see "permission denied for table user_canvas_credentials"

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on table public.user_canvas_credentials
  to authenticated;
