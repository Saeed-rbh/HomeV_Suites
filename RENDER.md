# Render deployment

Frontend: Node web service, root `frontend`, build `npm ci && npm run build`,
start `npm start -- --hostname 0.0.0.0`.
Set `NEXT_PUBLIC_API_URL` to the backend HTTPS URL ending in `/api`, then rebuild.

Backend: Node web service, root `server`, build
`npm ci --include=dev && npx prisma generate`, start
`npx prisma db push --skip-generate && npm start`.
Set `DATABASE_URL` and `DIRECT_URL` to the new Render Postgres internal URL,
generate `JWT_SECRET`, set `NODE_ENV=production`, and set `FRONTEND_URL` to
the frontend HTTPS origin (without a trailing slash).
Use `/api/health` as the health check path. Keep the services and database
in the same Render region.

The schema push initializes a new, empty database without accepting data loss.
The historical migrations target SQLite, so do not run those migrations against
Postgres. Establish a Postgres migration baseline before managing future schema
changes with migrations. Do not use `--accept-data-loss` or `--force-reset`.

No property data or administrator account is seeded automatically. Payment,
phone authentication, email delivery, and property-provider integrations require
their respective credentials. Without a Stripe key payment requests return 503.
Free Render Postgres databases expire after 30 days; export data or upgrade before
expiry. Free web services sleep when idle. Uploaded avatars on a free web service
are ephemeral; use durable storage before accepting production uploads.
