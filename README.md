# Nex Digital — Full-Stack 2 Technical Test

Full-stack application built for the Nex Digital Full-Stack 2 hiring test.

- **Admin** uploads a spreadsheet (`.xlsx` or `.csv`) with transactions and consults a paginated report with filters.
- **Regular users** sign up with name, email, CPF and password (JWT auth), check their transaction extract with filters, and see a wallet balance (sum of `approved` points only).

The project is built with strong opinions on quality: **SOLID**, **TDD**, **SDD**, **Git Conventional Commits**, **issues + PRs** per feature, and **LGPD** compliance (pragmatic level — encryption at rest for personal data, audit logging, right-to-export and right-to-delete endpoints).

## Tech stack

| Layer | Technology |
| --- | --- |
| Backend | Node 20 · Express · TypeScript · sequelize-typescript · MySQL 8 |
| Frontend | Vite · React 18 · TypeScript · React Router · Tailwind CSS · shadcn/ui |
| State | TanStack Query (server) · Zustand (client) · React Hook Form + Zod |
| Tests | Vitest · supertest · React Testing Library · MSW · Playwright |
| Infra | Docker Compose · GitHub Actions CI · pnpm workspaces |

## Quick start

> Prerequisites: **Docker Desktop 4.30+** and **pnpm 9+** (only needed if you want to run outside Docker).

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Generate real secrets (recommended)
#   JWT_SECRET     → openssl rand -base64 64
#   LGPD_DATA_KEY  → openssl rand -hex 32
#   LGPD_HMAC_PEPPER → openssl rand -base64 48
# Paste each value into .env, replacing the `replace-me-*` placeholders.

# 3. Boot everything
docker compose up --build
```

When the stack is healthy you'll have:

- API → http://localhost:3000 (Swagger UI at `/api/docs`)
- Web → http://localhost:5173
- Adminer (database UI) → http://localhost:8080  (Server: `mysql`, User/Password from `.env`)

Default admin credentials live in `.env` under `ADMIN_*` and are created by the database seeder on first boot.

## Project structure

```
apps/
  api/        Node + Express API (hexagonal-lite: domain / application / infrastructure / presentation)
  web/        Vite + React frontend (feature-sliced)
packages/
  shared/     DTOs and enums shared between api and web
docs/
  specs/      SDD — one spec per feature (YYYY-MM-DD-<topic>.md)
  adr/        Architecture Decision Records
  diagrams/   Mermaid diagrams (C4, ER, sequence)
```

## Development workflow

This project follows **Specification-Driven Development (SDD)** + **Test-Driven Development (TDD)**:

1. Open an Issue describing the feature.
2. Write a spec at `docs/specs/YYYY-MM-DD-<slug>.md`.
3. Create a branch `<type>/<issue>-<slug>` (e.g. `feat/3-auth`).
4. Write failing tests first (`test:` commits).
5. Implement until green (`feat:` / `fix:` commits).
6. Refactor (`refactor:` commits).
7. Open a PR, complete the checklist (security review, code review, react best-practices for TSX changes), and merge once CI is green.

All commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## Scripts

```bash
pnpm dev              # run api + web in watch mode
pnpm test             # run all tests
pnpm test:coverage    # coverage report (≥80% statements, ≥90% in services)
pnpm lint             # eslint
pnpm typecheck        # tsc --noEmit across all workspaces
pnpm format           # prettier --write
```

## LGPD compliance

This application handles personal data (CPF) and implements the following controls:

- **Consent** captured at registration (`users.consent_at`).
- **CPF cifrado** in MySQL via AES-256-GCM (`cpf_encrypted` VARBINARY) with a unique HMAC-SHA256 index (`cpf_hash`) for lookup.
- **Passwords** hashed with bcrypt (cost 12).
- **Helmet + CORS + rate-limit + Pino redact** to harden the API and avoid leaking PII in logs.
- **Right to access** — `POST /api/me/export` returns a JSON dump of personal data and transactions.
- **Right to deletion** — `DELETE /api/me` soft-deletes the user, anonymises the e-mail (`deleted-<uuid>@nex.invalid`) and zeroes the encrypted CPF.
- **Audit logs** — every admin action that touches personal data writes to `audit_logs`.

HTTPS is **mandatory in production**. The provided Docker setup is intended for local development only.

## License

This repository is part of a hiring test and is not currently licensed for redistribution.
