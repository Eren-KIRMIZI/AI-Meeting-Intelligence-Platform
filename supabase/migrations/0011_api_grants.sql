-- ---------------------------------------------------------------------------
-- 0011 — PostgREST role grants
--
-- Some Supabase projects carry altered default privileges that only grant
-- TRUNCATE/TRIGGER/REFERENCES on newly created public tables. RLS is then
-- correct but the API roles cannot select or write at all, which surfaces as
-- "permission denied for table <name>" from PostgREST.
--
-- Grant the standard Supabase CRUD privileges explicitly. RLS remains the
-- authorization boundary: anonymous requests still match no policies and
-- authenticated requests are scoped by is_org_member/is_org_admin.
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
