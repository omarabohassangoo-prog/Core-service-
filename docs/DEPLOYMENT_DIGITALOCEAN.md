# DigitalOcean App Platform Deployment Guide

This guide covers deployment on DigitalOcean App Platform.

## 1. Prerequisites
- DigitalOcean account
- GitHub repo connected
- Managed PostgreSQL database or external Postgres

## 2. Create app
1. Open DigitalOcean App Platform
2. Click Create > App
3. Select the GitHub repository
4. Choose the appropriate branch

## 3. Build settings
Use these commands:

Build command:
```bash
npm install
npx prisma generate
npm run build
```

Run command:
```bash
npx prisma migrate deploy && NODE_ENV=production npm run dev
```

## 4. Environment variables
Add these values in the App settings:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
JWT_SECRET=your-secure-key
REFRESH_TOKEN_SECRET=your-secure-key-2
ENCRYPTION_KEY=64-char-hex-key
APP_URL=https://your-app.com
CORS_ORIGIN=https://your-app.com
```

## 5. Database service
Create managed PostgreSQL if needed and inject its URL as `DATABASE_URL`.

## 6. Verify
Check the logs after deployment. Make sure Prisma migrations run, build completes, and the app boots.

## 7. Production hardening
- Use custom domain with HTTPS
- Restrict CORS to exact origin
- Do not commit secrets
- Protect backups and permanently stored logs

## 8. Final sign-off
Only launch after successful smoke testing and database validation.
