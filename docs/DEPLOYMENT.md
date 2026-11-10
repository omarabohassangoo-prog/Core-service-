# Deployment notes

These notes describe the current repository setup; they are not a guarantee that a production deployment has been validated.

## Current stack

The server runs the Express API and, in production mode, serves the Vite build from `dist/`. The Prisma datasource in the checked-in schemas is SQLite.

## Local run

1. Install dependencies: `bun install`.
2. Set the required environment variables: `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, and `ENCRYPTION_KEY`. Also set `PORT`, `CORS_ORIGIN`, and `APP_URL` for the environment.
3. Generate the Prisma client: `bunx prisma generate`.
4. Start the application: `bun run dev`.

The package scripts include `build` (`vite build`) and `lint` (`tsc --noEmit`). Confirm these complete successfully in your environment before release.

## Production checks

- Use a durable database location and establish tested backup/restore procedures. SQLite is the configured provider; migrating to another database requires a deliberate schema/migration change and testing.
- Set strong, unique secrets through the hosting provider's secret manager. Never commit actual `.env` values.
- Configure `CORS_ORIGIN` to the intended trusted frontend origin and verify the deployed URL settings.
- Build the frontend and run the server with `NODE_ENV=production`.
- Verify the real API routes, authentication, logging, error handling, health monitoring, and graceful shutdown in the deployment environment.
- Do not expose a development database or seed data containing private information.

The repository currently has no deployment workflow configured for a particular hosting provider. Configure provider-specific deployment only after selecting the host and storing credentials securely.
