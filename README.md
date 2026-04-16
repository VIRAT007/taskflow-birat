# TASKFLOW

## Overview

TASKFLOW is a small full-stack task tracker: users authenticate with email and password, manage **projects** they own, and work with **tasks** inside those projects (status, priority, assignee). A React SPA talks to a JSON API over HTTP; PostgreSQL is the source of truth via Prisma.

## Tech Stack


| Area       | Choices                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| API        | Node.js 20+, **Express 5**, TypeScript                                                                        |
| Data       | **PostgreSQL 16**, **Prisma** ORM                                                                             |
| Validation | **Zod** on request bodies and query params                                                                    |
| Auth       | **JWT** (Bearer) + **bcryptjs** for password hashes                                                           |
| Logging    | **Pino**                                                                                                      |
| Frontend   | **React 19**, **Vite 8**, **TanStack Query**, **Tailwind CSS 4**, **shadcn**-style UI stack, **React Router** |
| Containers | **Docker Compose** (Postgres + API + static frontend behind nginx)                                            |


## Architecture Decisions

- **Modular backend**: Controllers are thin; services hold business rules; repositories wrap Prisma. Shared helpers (pagination, env, errors) stay in `src/lib`.
- **Project visibility**: A user can access a project if they **own** it, are **assigned** to at least one task in it, or **created** at least one task in it. Listing and task routes enforce this consistently in the repository layer.
- **JWT access tokens only**: Single token type, 24h expiry, no refresh-token rotation—keeps the auth surface small at the cost of session ergonomics and revocation.
- **Docker entrypoint runs migrations**: Production-style images apply `prisma migrate deploy` on startup so a fresh volume gets a schema before traffic hits the app.
- **Integration tests use `prisma db push`**: Tests sync the test database to `schema.prisma` without depending on every migration file being applied first.

## Running Locally (Docker)

From the repository root:

1. **Optional**: set `JWT_SECRET` to a long random string (Compose defaults to a weak dev value).
2. **Optional**: seed demo data on first boot: `RUN_SEED=true` (see [Test credentials](#test-credentials)).
3. Start services:

```bash
docker compose up --build
```

- **App (SPA)**: `http://localhost:5173` (override with `FRONTEND_PORT`, e.g. `FRONTEND_PORT=8080 docker compose up`). The container serves the built UI and proxies `/api/*` to the backend, so you do not need CORS for the browser.
- **API**: `http://localhost:3000` (override with `BACKEND_PORT`, e.g. `BACKEND_PORT=3001 docker compose up`).
- **Postgres**: `localhost:5432`, user `taskflow`, password `taskflow`, database `taskflow` (see `docker-compose.yml`).

When the **frontend** container starts, it prints `== TASKFLOW ==` with the app and API URLs in the Compose logs. For local UI development without Docker, run the Vite app from `frontend/` (`npm install` then `npm run dev`). It proxies `/api/*` to `http://localhost:3000` in dev, so keep the API on port 3000 or adjust `frontend/vite.config.ts`. For a fixed API origin in a custom build, set `VITE_API_URL` (see `frontend/src/services/api.ts`).

### Backend without Docker

1. Start Postgres and set `DATABASE_URL` in `backend/.env` (copy from `backend/.env.example`).
2. In `backend/`: `npm install`, then apply schema (see [Migrations](#migrations)), then `npm run dev`.

## Migrations

- **Application migrations** live under `backend/prisma/migrations/` and are the source of truth for deployed environments.
- **After changing `schema.prisma`**: generate the Prisma client and create/apply migrations using your normal Prisma workflow (this repo does not commit ad-hoc hand-written migration SQL from agents).
- **Scripts** (`backend/package.json`):
  - `npm run db:migrate` — `prisma migrate dev` (local development).
  - `npm run db:migrate:deploy` — `prisma migrate deploy` (CI/production-style; used in the Docker entrypoint).
- **Seed** (optional): `npm run db:seed` runs `prisma/seed.ts` (destructive: clears users/projects/tasks before insert).

## Test Credentials

Seeded user (from `backend/prisma/seed.ts`):


| Field    | Value              |
| -------- | ------------------ |
| Email    | `test@example.com` |
| Password | `password123`      |


Enable seeding in Docker with `RUN_SEED=true` (or run `npm run db:seed` locally against your dev database—**only** on a disposable DB).

**Integration tests**: copy `backend/.env.test.example` to `backend/.env.test` and point `DATABASE_URL` at an isolated database or Postgres schema so tests do not wipe dev data. Run `npm run test:integration` from `backend/`.

## API Reference

Base URL: same host as the server (default `http://localhost:3000`). JSON bodies; `Content-Type: application/json`.

### Auth


| Method | Path             | Auth | Description                             |
| ------ | ---------------- | ---- | --------------------------------------- |
| `POST` | `/auth/register` | No   | Create user; returns `{ token, user }`. |
| `POST` | `/auth/login`    | No   | Login; returns `{ token, user }`.       |


**Register body**: `name` (string, 1–200), `email`, `password` (8–128 chars).  
**Login body**: `email`, `password`.

**Protected routes**: `Authorization: Bearer <token>`.

### Health


| Method | Path      | Auth | Response             |
| ------ | --------- | ---- | -------------------- |
| `GET`  | `/health` | No   | `{ "status": "ok" }` |


### Projects

All routes require Bearer auth.


| Method   | Path                  | Description                                                                                                                               |
| -------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/projects`           | Paginated list: query `page` (default 1), `limit` (default 20, max 100). Response: `{ projects, meta }`.                                  |
| `POST`   | `/projects`           | Body: `name`, `description`. Response: `{ project }`.                                                                                     |
| `GET`    | `/projects/:id`       | Single project (if visible).                                                                                                              |
| `PATCH`  | `/projects/:id`       | Body: at least one of `name`, `description`.                                                                                              |
| `DELETE` | `/projects/:id`       | 204 on success.                                                                                                                           |
| `GET`    | `/projects/:id/stats` | Task counts: `{ by_status, by_assignee }`.                                                                                                |
| `GET`    | `/projects/:id/tasks` | Paginated tasks. Query: `page`, `limit`, optional `status` (`todo` | `in_progress` | `done`), optional `assignee` (UUID or `unassigned`). |
| `POST`   | `/projects/:id/tasks` | Body: `title`, `description`; optional `status`, `priority`, `assignee_id` (UUID or `null`).                                              |


### Tasks


| Method   | Path         | Description                                                                                  |
| -------- | ------------ | -------------------------------------------------------------------------------------------- |
| `PATCH`  | `/tasks/:id` | Partial update; at least one of `title`, `description`, `status`, `priority`, `assignee_id`. |
| `DELETE` | `/tasks/:id` | 204 on success.                                                                              |


**Enums**: `TaskStatus`: `todo`, `in_progress`, `done`. `TaskPriority`: `low`, `medium`, `high`.

### Errors

4xx/5xx JSON shape (simplified): `{ "requestId": "...", "error": { "code": "...", "message": "...", "details": ... } }`. Validation failures may include Zod `flatten()` output in `details`.

## Tradeoffs

- **No frontend service in Docker Compose**: Faster to ship the API + DB image; local UI is a second process.
- `**db push` in integration test setup**: Keeps tests aligned with `schema.prisma` without blocking on migration history; it can diverge slightly from “real” migrate-deploy behavior until migrations are run.
- **Default `JWT_SECRET` in Compose**: Convenient for local demos; unsafe if that compose file is ever pointed at real data—override it.
- **JWT without refresh / blacklist**: Simple server, but tokens are valid until expiry and there is no server-side logout.
- **Password hashes in DB column on `User`**: Straightforward; no separate credential store.

## Future Improvements

- Refresh tokens or shorter-lived access tokens with rotation.
- OpenAPI (Swagger) spec generated from Zod schemas or routes.
- Docker service for the frontend (or a single compose profile for “full stack”).
- Role-based access (e.g. project members who are not owners) instead of inferring access only from ownership and task links.
- Rate limiting and structured audit logs for auth and destructive actions.

