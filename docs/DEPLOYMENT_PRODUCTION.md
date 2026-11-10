# Production Deployment Guide

This document is for deploying the application in a secure production environment.

## 1. Recommended production stack
- Node.js runtime
- PostgreSQL database (recommended over SQLite)
- Managed secrets store or hosting secrets panel
- HTTPS-enabled domain
- Reverse proxy or cloud hosting

## 2. Required environment variables
Use real values, never commit them to the repo.

Example:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
JWT_SECRET="<strong secret>"
REFRESH_TOKEN_SECRET="<strong secret>"
ENCRYPTION_KEY="<64 hex chars>"
APP_URL="https://your-domain.com"
CORS_ORIGIN="https://your-domain.com"
```

## 3. Install dependencies

```bash
npm install
# or
bun install
```

## 4. Generate Prisma client

```bash
npx prisma generate
# or
bunx prisma generate
```

## 5. Run database migration
If using PostgreSQL:

```bash
npx prisma migrate deploy
```

If using SQLite in local dev only:

```bash
npx prisma db push
```

## 6. Build the application

```bash
npm run build
# or
bun run build
```

## 7. Start the app in production mode

```bash
NODE_ENV=production npm run dev
```

For a production hosting service, use the service's start command, usually the runtime will run the app after build completion.

## 8. Production hardening
- Keep all secrets in the host secret manager.
- Enforce HTTPS.
- Restrict CORS to the exact production domain.
- Disable debug output and dev-only tokens.
- Keep admin initialization controlled by secure installation flow only.
- Protect backup files and database dumps.

## 9. Backup and restore
- Store backups in a protected directory outside the public web root.
- Test restore process at least once before production release.
- Keep retention policy defined and documented.

## 10. Health checks
After deployment, verify:
- App boots without errors
- API returns expected responses
- Auth endpoints work
- Administrator routes require correct permissions
- Frontend loads correctly
- Database connection is healthy

## 11. Release gates
Before final launch:
- All security fixes are merged
- No `.env` files are committed
- No SQLite DB files are included in the repo
- No default seeded admin remains in production
- Final smoke test passes in production-like environment

## 12. Recommended hosting providers
- Render
- Railway
- DigitalOcean App Platform
- Fly.io
- Google Cloud Run
- AWS ECS / Elastic Beanstalk

Choose one and configure secrets, build commands, and startup command accordingly.

## 13. Suggested production policy
- DB: PostgreSQL
- Logs: structured logging enabled
- Monitoring: uptime + error monitoring
- Backups: scheduled and tested
- Security: HTTPS + strict CORS + rate limiting + RBAC
- Rollback: maintain a documented rollback plan

## 14. Final sign-off
A production deployment is only ready when:
- Security checklist passes
- Build succeeds
- Database is healthy
- Recovery plan is tested
- Monitoring is active
- Team approves production launch

