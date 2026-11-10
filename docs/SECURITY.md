# Security notes

This document is a starting checklist, not a security audit or certification.

## Secrets and data

- Never commit `.env` files, API keys, JWT secrets, encryption keys, or production credentials.
- Use unique strong values for `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, and `ENCRYPTION_KEY`; store them in the hosting provider's secret manager.
- Check whether any tracked SQLite database or seed data contains personal or confidential information before publishing the repository. Remove sensitive data and rotate any credentials that may have been exposed.

## Application configuration

- Configure CORS with only trusted origins before deployment; review `backend/src/app.ts` and the environment configuration.
- Confirm authorization checks protect every administrative and user-specific API route.
- Review authentication, token expiration/rotation, password reset, rate limiting, and error responses before production use.
- Keep dependencies updated and run type checks/builds before releases.

## Operational safeguards

- Use HTTPS in production.
- Establish and test database backups and restoration.
- Limit access to production credentials and administrative accounts.
- Monitor application errors and security events without logging secrets or sensitive user data.
- Publish a security contact and a vulnerability disclosure process before inviting external reports.
