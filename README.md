# Nex Digital — Full-Stack 2 Technical Test

Full-stack application built for the Nex Digital Full-Stack 2 hiring test.

- **Admin** uploads a transactions spreadsheet (`.xlsx` or `.csv`) and consults a paginated, filterable report.
- **Regular users** sign up with name, email, CPF and password (JWT auth), check their transaction extract with filters, and see a wallet balance that sums only the *approved* points.

The project is built with strong opinions on quality: **SOLID** architecture, **TDD** discipline (129 tests), **SDD** documented specs, **Git Conventional Commits** + merge-commit history, and **LGPD** compliance at a pragmatic level — encryption at rest for the CPF, audit logging, right-to-export and right-to-delete endpoints.

## Tech stack

| Layer | Technology |
| --- | --- |
| Backend | Node 20 · Express · TypeScript · sequelize-typescript · MySQL 8 |
| Frontend | Vite · React 18 · TypeScript · React Router · Tailwind CSS · shadcn/ui |
| State | TanStack Query (server) · Zustand (client) · React Hook Form + Zod |
| Tests | Vitest · supertest · React Testing Library · MSW |
| Infra | Docker Compose · GitHub Actions CI · pnpm workspaces |

See [`docs/adr/ADR-001-stack.md`](./docs/adr/ADR-001-stack.md) for the rationale.

## Quick start with Docker

> Prerequisites: **Docker Desktop 4.30+**. No Node or pnpm needed if you only want to run the app.

```bash
# 1. Copy the environment template
cp .env.example .env

# 2. Replace the LGPD placeholders with real secrets
#   JWT_SECRET     → openssl rand -base64 64
#   LGPD_DATA_KEY  → openssl rand -hex 32           (must be 64 hex chars)
#   LGPD_HMAC_PEPPER → openssl rand -base64 48
# Paste each into .env, replacing the `replace-me-*` placeholders.

# 3. Boot everything
docker compose up --build

# 4. (first run only) run migrations and seed the default admin
docker compose exec api pnpm db:migrate
docker compose exec api pnpm db:seed
```

When the stack is healthy you'll have:

| Service | URL |
| --- | --- |
| Web (Vite dev server) | http://localhost:5173 |
| API | http://localhost:3000 |
| API health probe | http://localhost:3000/health |
| Adminer (DB inspector) | http://localhost:8080 — server `mysql`, user/password from `.env` |
| MySQL (direct) | localhost:3306 |

Default credentials live in `.env` under `ADMIN_*` (`admin@nex.com` / `ChangeMe123!` if you didn't change them).

A sample spreadsheet you can upload is at [`docs/sample-import.csv`](./docs/sample-import.csv). It uses the canonical valid CPF `282.279.300-00`. Register a user with that CPF first (or let the admin see the row as `user_not_found` in the skipped list).

## Local development without Docker (optional)

> Prerequisites: Node 20 + pnpm 9 + a running MySQL 8.

```bash
cp .env.example .env       # adjust MYSQL_HOST=127.0.0.1
pnpm install
pnpm --filter @nex/api db:migrate
pnpm --filter @nex/api db:seed
pnpm dev                   # runs api (3000) + web (5173) concurrently
```

## Project structure

```
apps/
  api/        Node + Express API
    src/
      domain/          Entities + repository / port interfaces (no libs)
      application/     Use cases (1 class = 1 .execute())
      infrastructure/  Sequelize, crypto, parsers, HTTP server, middlewares
      presentation/    Controllers, routes, Zod schemas
      shared/          env, logger, errors, cpf, clock
      main.ts          Composition root (DI manual)
    tests/             unit / integration (Vitest + supertest)
  web/        Vite + React frontend
    src/
      app/             router, providers, layout, ProtectedRoute
      features/        Feature slices (auth, extract, wallet, account, admin/*)
      components/ui/   shadcn primitives
      lib/             api-client, format helpers
      stores/          Zustand stores
packages/
  shared/     DTOs and enums shared between api and web
docs/
  specs/      SDD — one spec per feature (YYYY-MM-DD-<topic>.md)
  adr/        Architecture Decision Records
  diagrams/   Mermaid diagrams (C4, ER, sequence)
```

## How it works at a glance

```
┌─────────────┐   Bearer JWT    ┌───────────────────────┐    sequelize-typescript    ┌─────────────┐
│  @nex/web   │ ──────────────▶ │       @nex/api        │ ─────────────────────────▶ │   MySQL 8   │
│  (SPA)      │ ◀────────────── │ Express · hexagonal   │ ◀───────────────────────── │             │
└─────────────┘                 └───────────────────────┘                            └─────────────┘
                                        ▲
                                        │ audit trail
                                        ▼
                                  audit_logs table
```

- The API is layered **domain → application → infrastructure → presentation** with all dependencies injected in `main.ts`. See [`docs/adr/ADR-003-hexagonal-lite.md`](./docs/adr/ADR-003-hexagonal-lite.md).
- CPF is stored as **AES-256-GCM ciphertext** (per-row IV + auth tag) plus an **HMAC-SHA256 index** for lookup. See [`docs/adr/ADR-002-lgpd-data-protection.md`](./docs/adr/ADR-002-lgpd-data-protection.md).
- Admin spreadsheet uploads are **idempotent on `sha256(file)`** — retrying the same file returns the previous batch with `importedRows = 0`.

## API surface

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | public | Register a user (name, email, CPF, password, consent). |
| `POST` | `/api/auth/login` | public | Authenticate, returns JWT. |
| `GET` | `/api/me` | user/admin | Authenticated profile. |
| `GET` | `/api/me/transactions` | user | Paginated extract, filters by status and date range. |
| `GET` | `/api/me/wallet` | user | Sum of `approved` points. |
| `POST` | `/api/me/export` | user/admin | LGPD JSON dump (downloads as attachment). |
| `DELETE` | `/api/me` | user/admin | LGPD anonymisation + soft delete. |
| `POST` | `/api/admin/imports` | admin | Multipart upload of an `.xlsx` / `.csv` (5 MB / 50 000 rows). |
| `GET` | `/api/admin/transactions` | admin | Paginated report, filters CPF / product / date range / value range / status. |

## Testing

```bash
pnpm test               # all tests across workspaces
pnpm test:coverage      # coverage report (target ≥80%, ≥90% in application/)
pnpm typecheck          # tsc --noEmit across all workspaces
pnpm lint               # eslint, zero-warning policy
pnpm format             # prettier --write
```

Current numbers:

| Workspace | Tests | Notes |
| --- | --- | --- |
| `@nex/api` | 90 | Vitest + supertest. Unit tests for CPF, crypto, use cases. Integration tests for every HTTP route. |
| `@nex/web` | 39 | Vitest + RTL + MSW. Pages, schemas, stores, formatters. |
| **Total** | **129** | |

## Process & contribution

This repository was built following the workflow we expect to use day-to-day:

1. Open an **Issue**.
2. Author a **spec** in `docs/specs/` (SDD).
3. Create a branch `<type>/<issue>-<slug>` (`feat`, `fix`, `chore`, `docs`).
4. Write failing tests first (`test:` commit), then implementation (`feat:` / `fix:` commit), then refactor (`refactor:` commit).
5. Open a PR using [`.github/pull_request_template.md`](./.github/pull_request_template.md). Run the checklist:
   - `/security-review` — required for every PR.
   - `/code-review` — required for every PR.
   - `/react-best-practices` — required for PRs that touch `.tsx`.
   - `/shadcn` — required when installing/composing UI primitives.
   - `/frontend-design:frontend-design` — review the UI before opening.
6. Merge once CI is green (lint + typecheck + tests).

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). `git log --oneline --graph` shows the feature merge tree end-to-end.

## LGPD compliance — what is implemented

- **Consent** captured at registration (`users.consent_at`).
- **CPF cifrado** at rest with AES-256-GCM (32-byte key from `LGPD_DATA_KEY`, fresh IV per row).
- **Unique CPF lookup** via HMAC-SHA256 (`LGPD_HMAC_PEPPER`), so MySQL never sees a plaintext CPF.
- **Passwords** hashed with bcryptjs cost 12.
- **Helmet + strict CORS allow-list + rate-limit** (`/auth/*` 5/min, global 100/min).
- **PII redaction** in logs (Pino redact for `password`, `cpf`, `authorization`).
- **Right of access** — `POST /api/me/export` downloads a JSON file with the user's data and full transaction history.
- **Right of erasure** — `DELETE /api/me` soft-deletes the row, anonymises the e-mail (`deleted-<uuid>@nex.invalid`), zeroes the encrypted CPF and the lookup hash, invalidates the session.
- **Audit log** — every admin action that touches personal data writes to `audit_logs` (`import.run`, `report.view`, `lgpd.export`, `lgpd.delete`).

HTTPS is **mandatory in production**. The Docker Compose setup is intended for local development only.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `Invalid environment configuration:` on boot | `.env` is missing keys; check `.env.example`. |
| API starts but `db:migrate` fails | MySQL container isn't healthy yet — wait a few seconds and retry. |
| Upload returns 422 `unsupported file extension` | Only `.xlsx` and `.csv` are accepted. |
| Upload returns 200 with `importedRows: 0` | The exact same file was already imported — the response includes the original `batchId`. Upload a new file or change a row to get a fresh batch. |
| Login returns 429 | The `/auth/*` rate limit kicked in (5 req/min by IP); wait a minute. |
| `tsc` reports `rootDir` errors | Run from a workspace (`pnpm --filter @nex/api typecheck`); the build config (`tsconfig.build.json`) excludes `tests/`. |
| CORS blocks the SPA | Set `API_CORS_ORIGIN` to the exact origin (no trailing slash) in `.env`. |

## License

This repository was produced for a hiring test and is not currently licensed for redistribution.
