# Core Service

A full-stack web application with a React/TypeScript frontend and an Express/TypeScript backend. The repository currently uses Prisma with SQLite.

## Technology

- React, TypeScript, Vite, Tailwind CSS
- Express and Node.js
- Prisma ORM with SQLite
- JWT-based authentication dependencies

## Repository layout

- `src/` — frontend application
- `backend/src/` — API application, routes, middleware, and configuration
- `prisma/` — database schema and seed script
- `server.ts` — application server entry point

## Local development

Requirements: Node.js and Bun (the repository includes `bun.lock`).

1. Install dependencies with Bun: `bun install`
2. Configure the environment. `backend/src/config/env.ts` requires `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, and `ENCRYPTION_KEY`; also configure `PORT`, `CORS_ORIGIN`, and `APP_URL` as appropriate. Do not use the example placeholders as production secrets.
3. Generate the Prisma client: `bunx prisma generate`
4. Start the development server: `bun run dev`

The server defaults to port 3000. The available package scripts are `dev`, `build`, `preview`, `clean`, and `lint`.

## Database

The checked-in Prisma schemas use SQLite. Do not set a PostgreSQL connection string unless the Prisma datasource and migrations have been deliberately updated and tested for PostgreSQL. Avoid committing real user data or secrets in database files.

## Deployment and security

This repository is a web application, not a GitHub App or GitHub Action listing. Review `docs/DEPLOYMENT.md` and `docs/SECURITY.md` before deploying. The application has not been represented here as production-certified; deployment, security, backups, and legal requirements must be validated for your use case.
