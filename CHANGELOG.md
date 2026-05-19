# Changelog

All notable changes to this project are documented here, following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Scaffold** — monorepo (`pnpm workspaces`) with `apps/api`, `apps/web`,
  `packages/shared`; Docker Compose (MySQL 8 + Adminer + API + Web);
  GitHub Actions CI (lint, typecheck, test); ESLint flat config; Prettier;
  EditorConfig; SDD/ADR templates.
- **API auth** — register / login (JWT HS256, 15 min); role-gated `/me`;
  bcrypt 12; AES-256-GCM cipher for CPF; HMAC-SHA256 lookup index; helmet;
  strict CORS allow-list; Pino with PII redact; rate-limit (5/min on
  `/auth/*`, 100/min global); admin seeder; typed error hierarchy.
- **Web auth** — login + register pages (RHF + Zod), JWT-aware axios
  client, Zustand auth store (persisted), ProtectedRoute, role-based
  redirects.
- **Spreadsheet import** — `POST /api/admin/imports` with idempotency on
  the file SHA-256, `.xlsx` and `.csv` parsers (Strategy), row-level
  validation, skipped-row reporting, audit logging.
- **Admin upload UI** — drag-friendly file input, live import summary,
  toast feedback.
- **Admin report API** — `GET /api/admin/transactions` with filters
  (CPF, product, date range, value range, status) and server-side
  pagination; FULLTEXT-friendly description filter.
- **Admin report UI** — filter bar, paginated responsive table, status
  badges.
- **User extract & wallet API** — `GET /api/me/transactions`,
  `GET /api/me/wallet`.
- **User extract & wallet UI** — paginated table with filters; wallet
  hero card.
- **LGPD endpoints** — `POST /api/me/export` (JSON dump with decrypted
  CPF, audit-logged), `DELETE /api/me` (anonymise + soft-delete +
  audit log); AccountPage with confirmation flow and JSON download.
- **Docs** — ADRs (stack, LGPD, hexagonal); Mermaid diagrams (C4
  container, ER, sequence); per-feature specs under `docs/specs/`; sample
  spreadsheet (`docs/sample-import.csv`).
