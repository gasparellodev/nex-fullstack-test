# ADR-001: Technology stack

- **Date**: 2026-05-18
- **Status**: Accepted

## Context

The Nex Digital Full-Stack 2 hiring test ships with two slightly contradictory
sets of requirements:

1. The original statement: **MySQL + Node.js + Sequelize**.
2. The accompanying addendum: **TypeScript + SOLID + TDD + SDD**, plus
   shadcn/ui + React + Docker + LGPD on top.

We need to pick one stack that satisfies both groups, can be evaluated against
the published criteria (organisation, naming, performance, security, git
discipline, code in English, SOLID, agility) and remains tractable inside the
window of a hiring test.

## Decision

| Layer | Choice | Reason |
| --- | --- | --- |
| Runtime | **Node.js 20 LTS** | Current LTS; matches statement. |
| Language | **TypeScript 5** (strict) | Required by the addendum; enables SOLID + safer refactors. |
| HTTP framework | **Express 4** | Battle-tested, minimal, easy to layer behind controllers. |
| ORM | **sequelize-typescript** over Sequelize 6 | Honors the statement (Sequelize) while giving us decorators + typed models. |
| Database | **MySQL 8.4** | Required by the statement. Run in a container; no host install. |
| Validation | **Zod** | Same schemas reusable in `apps/web` via `packages/shared`. |
| Logging | **pino** | High throughput, native `redact` for PII (LGPD). |
| Tests | **Vitest** + **supertest** | Fast TS-native runner shared between API and Web. |
| Frontend build | **Vite 5** + **React 18** | Lightweight SPA; pairs well with Tailwind/shadcn. |
| Frontend router | **React Router 6** | Mature, simple, no SSR needs. |
| Frontend state | **TanStack Query** + **Zustand** | Server cache vs. client store, no Redux boilerplate. |
| Forms | **react-hook-form** + Zod | Validation reuse, low re-renders. |
| UI kit | **Tailwind CSS** + **shadcn/ui** (Radix under the hood) | Accessible primitives, requested by user. |
| Auth | **JWT HS256** (15 min) | Stateless; aligns with statement. Refresh deferred. |
| Package manager | **pnpm 9 workspaces** | Cheapest monorepo setup; types shared via `packages/shared`. |
| Orchestration | **Docker Compose** | Single `up` boots MySQL + Adminer + API + Web. |
| CI | **GitHub Actions** | Free, integrates with Issues/PRs. |

## Consequences

### Positive

- Honors both the literal statement and the addendum.
- TypeScript + Zod + Sequelize-TS keeps the boundary types coherent end-to-end.
- pnpm workspaces enables sharing DTOs between API and Web with no extra build
  step, which keeps SOLID-friendly abstractions cheap.
- Docker Compose makes "clone and run" a single command, which the user asked
  for explicitly.

### Negative

- `sequelize-typescript` is in maintenance mode (still works on Sequelize 6);
  if Sequelize 7 lands during the test we may need a switch.
- Two test environments to maintain (Vitest configured per workspace).
- Strict TS + decorators add a small ramp-up for anyone new to the codebase.

## Alternatives considered

- **TypeORM** instead of Sequelize — better TS ergonomics but the statement
  pins Sequelize.
- **Next.js** instead of Vite — backend is already separate, so SSR would add
  cost without benefit.
- **Prisma** — excellent DX but contradicts the statement.
- **MySQL → SQLite** to simplify Docker — easier locally but violates the
  statement.
