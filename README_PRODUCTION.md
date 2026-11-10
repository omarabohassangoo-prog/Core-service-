# Core Service - Production Ready Guide

A full-stack enterprise web application built with React, TypeScript, Vite, Express, Prisma, and SQLite in development mode. This guide covers the production-ready setup, deployment paths, and release checklist.

## Overview

Core Service is a modular enterprise platform with:
- React + Vite frontend
- Express + TypeScript backend
- Prisma ORM
- SQLite for local development
- PostgreSQL recommended for production
- JWT-based auth and refresh tokens
- User, role, and permission management
- Admin dashboards and system tooling
- Install flow and application bootstrap

## Tech stack

- Frontend: React 19, Vite, TypeScript
- Backend: Node.js, Express
- Database: Prisma + SQLite dev, PostgreSQL recommended for production
- Auth: JWT + refresh token rotation
- Style: Tailwind CSS
- Security: Helmet, CORS, request IDs, permission-based authorization

## Requirement summary

Before production release, ensure the following are configured:
- Real environment variables
- HTTPS enabled in production
- PostgreSQL database configured for production
- Strong secrets and keys
- Backup and restore tested
- Admin installation flow protected
- Production build passes

## Local setup

### Install

```bash
npm install
# or
bun install
```

### Environment variables

Copy `.env.example` or `.env.production.example` and set valid values.

Recommended production variables:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
JWT_SECRET="<32+ chars>"
REFRESH_TOKEN_SECRET="<32+ chars>"
ENCRYPTION_KEY="<64 char hex>"
APP_URL="https://your-domain.com"
CORS_ORIGIN="https://your-domain.com"
```

### Prisma

```bash
npx prisma generate
npx prisma migrate deploy
```

### Build

```bash
npm run build
```

### Run in production-like mode

```bash
NODE_ENV=production npm run dev
```

## Production deployment options

This project is ready for hosting on:
- Render
- Railway
- DigitalOcean App Platform
- Google Cloud Run
- VPS / Linux server

Recommended default:
- PostgreSQL database
- HTTPS-enabled domain
- Reverse proxy or platform-managed TLS
- Managed secrets and monitoring

## Recommended database strategy

Use PostgreSQL in production. SQLite is acceptable for local development and testing only.

## Security checklist

Before final launch:
- No `.env` committed to Git
- No secrets in repository history
- No default admin login remains
- No debug tokens in production
- No mock credentials in production
- CORS restricted to trusted domain
- HTTPS enforced
- Logs sanitized
- Backups protected

## Release checklist

- [ ] Secrets configured in host secret manager
- [ ] Production database created and tested
- [ ] Prisma client generated successfully
- [ ] Migrations passed
- [ ] Build succeeded
- [ ] App started without runtime errors
- [ ] Admin routes protected properly
- [ ] Backup restore validated
- [ ] Monitoring enabled
- [ ] Final smoke test passed

## Deployment docs

See:
- `docs/DEPLOYMENT_PRODUCTION.md`
- `docs/DEPLOYMENT_RENDER.md`
- `docs/DEPLOYMENT_RAILWAY.md`
- `docs/DEPLOYMENT_DIGITALOCEAN.md`
- `docs/DEPLOYMENT_CLOUDRUN.md`

## Support note

This repository is intended for deployment as a production system, not as a public demo or local-only prototype. Use production-safe hosting, secure secrets, proper database management, and testing before release.
