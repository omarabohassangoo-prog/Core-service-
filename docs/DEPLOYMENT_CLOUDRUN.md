# Google Cloud Run Deployment Guide

This guide explains how to deploy the project to Google Cloud Run.

## 1. Prerequisites
- Google Cloud project
- Billing enabled
- Cloud Run API enabled
- Cloud SQL database or external Postgres
- GCP credentials configured via CLI or service account

## 2. Containerization
Create a container image using your project source and build it with Cloud Build.

## 3. Environment variables
Set the following production values in Cloud Run:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
JWT_SECRET=your-secret
REFRESH_TOKEN_SECRET=your-secret-2
ENCRYPTION_KEY=64-char-hex-key
APP_URL=https://your-service-url.a.run.app
CORS_ORIGIN=https://your-service-url.a.run.app
```

## 4. Build and deploy
Example command pattern:

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/core-service

gcloud run deploy core-service \
  --image gcr.io/PROJECT_ID/core-service \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=3000
```

## 5. Database connection
Use Cloud SQL or another managed Postgres service. Set it as `DATABASE_URL` and test it before launch.

## 6. Production notes
- Use the Cloud Run URL or your custom domain for `APP_URL`
- Set `CORS_ORIGIN` to the correct domain
- Keep logs and audit trails secure
- Test migration and app boot before release

## 7. Final checks
- app boots properly
- auth works
- admin routes protected
- DB connectivity stable
- no sensitive values in environment logs
