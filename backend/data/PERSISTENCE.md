# StyleOS persistence contract

`styleos-schema.sql` is the production schema for Supabase/PostgreSQL. It keeps personal memory, wardrobe items, decision evidence and user-owned image metadata separate so that a user can delete or export the relevant data later.

The application currently uses `FileMemoryRepository` only for local development and automated tests. It persists a normalized, revisioned state snapshot under `backend/storage/`, but this adapter must not be used for a public deployment because it has no real authentication and ephemeral hosts can discard local files. Production disables these routes unless `ENABLE_UNAUTHENTICATED_MEMORY_SYNC=true` is deliberately set; never set that flag on a public host.

`styleos-schema.sql` is a bootstrap for a new Supabase project, not a migration for an existing database. Before production, configure Supabase Auth, apply the schema, create private image buckets, add RLS policies for `storage.objects`, and implement the authenticated Supabase repository. The backend must verify the user JWT and derive `user_id` from its `sub`; it must never trust `X-StyleOS-Owner`. If a service-role client is used, every query must still be scoped to that verified user because service-role credentials bypass RLS. Service-role credentials must never be exposed to the frontend.

Production also needs account export/deletion, object deletion, a retention cleanup job, rate limiting, and versioned SQL migrations. Derived memory and decision output are read-only to authenticated clients in the bootstrap schema and must be written through the trusted backend rule engine.
