# Render Deployment Guide

This guide shows how to deploy the project on Render.

## 1. Prerequisites
- GitHub repo connected to Render
- PostgreSQL database ready
- Domain configured (optional)

## 2. Create the web service
1. Go to Render dashboard
2. Click New > Web Service
3. Connect this GitHub repository
4. Choose Node runtime

## 3. Build and start settings
Set:

Build command:
```bash
npm install
npx prisma generate
npm run build
```

Start command:
```bash
npx prisma migrate deploy && NODE_ENV=production npm run dev
```

## 4. Add environment variables
Use the production values from `.env.production.example`.

Required:
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/dbname?schema=public
JWT_SECRET=your-long-secret
REFRESH_TOKEN_SECRET=your-another-long-secret
ENCRYPTION_KEY=64-char-hex-key
APP_URL=https://your-app.onrender.com
CORS_ORIGIN=https://your-app.onrender.com
```

## 5. Database setup
Create a PostgreSQL database on Render or attach an external database.

## 6. Health and validation
After deployment:
- check app loads
- confirm login works
- confirm admin access works
- confirm build completes
- confirm migrations apply

## 7. Recommended production hardening
- Use a custom domain with HTTPS
- Set `CORS_ORIGIN` to the exact domain
- Disable debug behavior in production
- Protect backups and logs
- Test restore process before full launch

## 8. Rollback
If deployment fails:
- redeploy previous commit
- verify environment variables
- verify database connectivity
- inspect logs and app errors
