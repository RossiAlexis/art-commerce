# Preserve backend contracts during the rewrite

The TanStack Start rewrite will reuse the existing Supabase PostgreSQL database, Prisma schema and migration history, username/password authentication, database-backed sessions, and database image blobs. The new repository becomes the sole owner of Prisma migrations at production cutover; moving images to object storage is deliberately deferred so framework migration risk is not combined with data and authentication migrations.
