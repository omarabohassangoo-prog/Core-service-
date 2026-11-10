# Deploying Core Service on Render

This repository's Prisma schemas currently use **SQLite**, not PostgreSQL. This Render configuration therefore uses a persistent disk mounted at `/var/data` and stores the database at `file:/var/data/core.db`. Do not attach a PostgreSQL URL unless the Prisma datasource and migrations have been deliberately migrated and tested for PostgreSQL.

## Deploy with Blueprint

1. Push this repository to GitHub and open Render.
2. Create a new **Blueprint** and select this repository. Render reads `render.yaml`.
3. The web service uses the Dockerfile and a persistent disk. The Starter plan is specified because the database must persist across deploys; confirm the plan and disk pricing in Render before creating the service.
4. In the service environment settings, provide the following values for variables marked `sync: false`:
   - `ENCRYPTION_KEY`: exactly 64 hexadecimal characters (32 bytes). Generate locally with `openssl rand -hex 32`.
   - `APP_URL`: the public HTTPS URL Render assigns to the service, for example `https://core-service.onrender.com`.
   - `CORS_ORIGIN`: the exact browser origin, without a trailing slash. If the same service serves the frontend, set it to the same URL as `APP_URL`.
   - `GEMINI_API_KEY`: optional; set only if the feature is used.
5. Render generates `JWT_SECRET` and `REFRESH_TOKEN_SECRET`. Do not reuse them elsewhere or commit them.
6. Deploy and wait for `/api/health/live` to pass. Then open the service URL and complete the initial `/install` setup using a unique administrator email and strong password.

## Runtime details

- Build uses the repository's Bun lockfile, generates Prisma Client from `prisma/schema.prisma`, and builds the Vite frontend.
- The container runs `bun run dev`; when `NODE_ENV=production`, `server.ts` serves `dist/` and does not start Vite middleware.
- Render provides `PORT=10000`; the server binds to `0.0.0.0`.
- SQLite is suitable here only for a single-instance deployment. A persistent disk is local to one service instance and prevents horizontal scaling. For multiple instances or higher availability, migrate both Prisma schemas and migrations to PostgreSQL first, then deploy that tested migration.
- A persistent disk is not a backup. Configure and periodically test a separate backup and restore plan.

## Important checks

- The configured readiness path currently checks process liveness, not database connectivity. Verify the database after deployment through the application or a protected operational check.
- Confirm the seed and install flow on a new database. Never enable a known default administrator credential.
- Set the Render service's `APP_URL` and `CORS_ORIGIN` after Render gives you the final URL, and update them if you add a custom domain.
- Do not use a committed SQLite file as production data. The service uses `/var/data/core.db` on the persistent disk.
- Review deployment logs and run the project's type check/build before accepting the release.
