This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Backend API (`apps/api`)

The backend is a separate NestJS application in `apps/api` with its own `package.json` and `package-lock.json`. It does not change the frontend: the frontend still uses mock data and is not connected to the API yet. Neither the frontend nor the API is deployed.

Stack: NestJS 11, TypeScript, Prisma 7 (`@prisma/adapter-pg`), PostgreSQL, Argon2id password hashing, JWT (HS256) access tokens.

### Requirements

- Node.js 20.19+ (CI uses Node.js 24)
- npm
- PostgreSQL 14+ (CI uses PostgreSQL 17)

### Setup

```bash
cd apps/api
npm install
cp .env.example .env
```

Edit `apps/api/.env`:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string for the development database |
| `JWT_SECRET` | yes | Random string, at least 32 characters (for example `openssl rand -base64 48`) |
| `JWT_EXPIRES_IN_SECONDS` | no | Access token lifetime, default `3600` |
| `PORT` | no | API port, default `3001` (the frontend uses `3000`) |
| `NODE_ENV` | no | `development`, `test` or `production` |
| `TEST_DATABASE_URL` | for e2e tests | Separate database whose name must end with `_test` |

The API refuses to start if a required variable is missing or invalid. Never commit `.env`.

### PostgreSQL

Any local PostgreSQL works. Example with Docker:

```bash
docker run -d --name kassa-postgres -p 5432:5432 \
  -e POSTGRES_USER=kassa -e POSTGRES_PASSWORD=kassa_local_password -e POSTGRES_DB=kassa_ai \
  postgres:17
docker exec kassa-postgres createdb -U kassa kassa_ai_test
```

### Prisma

```bash
cd apps/api
npm run prisma:generate         # generates the client into src/generated/prisma (git-ignored)
npm run prisma:migrate:deploy   # applies committed migrations
npm run prisma:migrate:dev      # creates a new migration after changing prisma/schema.prisma
```

### Running

```bash
# API (http://localhost:3001)
cd apps/api
npm run start:dev               # or: npm run build && npm start

# Frontend (http://localhost:3000), from the repository root
npm run dev
```

### Tests

```bash
cd apps/api
npm test                        # unit tests, no database needed
npm run test:e2e                # HTTP + database tests for Auth
```

E2E tests use `TEST_DATABASE_URL` only, refuse to run unless the database name ends with `_test`, apply migrations to it and delete all rows from the `users` table between tests. Do not point it at a database with real data.

### Auth

Users are identified by email. Emails are trimmed and lowercased before saving, so `Owner@Example.com` and `owner@example.com` are the same account. `name` is optional. Passwords must be 8–128 characters and are stored only as Argon2id hashes.

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | `{ "email", "password", "name"? }` | `201` with `{ accessToken, tokenType: "Bearer", expiresIn, user }` |
| `POST` | `/auth/login` | `{ "email", "password" }` | `200` with the same shape |
| `GET` | `/auth/me` | header `Authorization: Bearer <token>` | `200` with `{ user }` |

`user` is `{ id, email, name, createdAt }`; the password hash is never returned.

Errors share one format:

```json
{ "statusCode": 400, "error": "Bad Request", "message": "Validation failed", "details": ["..."] }
```

- `400` invalid input (unknown fields are rejected), `401` wrong credentials or a missing/invalid/expired token, `409` email already registered, `500` internal error with no internal details.
- Login returns the same `401` message for an unknown email and a wrong password.

### CI

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`:

- frontend: `npm ci`, `npm run lint`, `npm run build` (includes TypeScript type checking)
- API (with a temporary PostgreSQL 17 service and test-only secrets): `npm ci`, `npm run prisma:generate`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run prisma:migrate:deploy`, `npm run test:e2e`, `npm run build`

### Current limitations

- Only registration, login and the current-user profile exist. There are no refresh tokens, logout/token revocation, password reset or email verification; emails are not verified.
- Access tokens are valid until they expire (default 1 hour).
- No rate limiting on login/registration yet; add it before any public deployment.
- No CORS configuration: the frontend is not connected to the API yet.
- Not production-ready and not deployed.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
