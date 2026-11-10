# Railway Deployment Guide

This guide explains how to deploy the project on Railway.

## 1. Prerequisites
- Railway account
- GitHub repository linked
- PostgreSQL database service created

## 2. Create services
1. Create a new project in Railway
2. Add PostgreSQL service
3. Add a new web service for this repository

## 3. Configure build
Set the build command:
```bash
npm install
npx prisma generate
npm run build
```

Set the start command:
```bash
npx prisma migrate deploy && NODE_ENV=production npm run dev
```

## 4. Add environment variables
Set the same production variables as in `.env.production.example`:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=${{POSTGRES_URL}}
JWT_SECRET=strong-secret
REFRESH_TOKEN_SECRET=strong-secret-2
ENCRYPTION_KEY=64-char-hex-key
APP_URL=https://your-railway-domain.up.railway.app
CORS_ORIGIN=https://your-railway-domain.up.railway.app
```

## 5. Verify database connection
Ensure Prisma connects to the Railway Postgres service.

## 6. Deploy
Trigger deployment and monitor logs.

## 7. Production checklist
- App boots successfully
- Admin and user auth works
- Prisma migrations complete
- build succeeds
- HTTPS is enabled by default
- secret values are not exposed

## 8. Final notes
Railway is a fast and simple option for shipping a Node.js project with Postgres. It is suitable for production use when the app is properly configured and the database is kept secure.
