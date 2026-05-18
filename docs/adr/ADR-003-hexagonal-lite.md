# ADR-003: Hexagonal-lite architecture for the API

- **Date**: 2026-05-18
- **Status**: Accepted

## Context

The hiring brief calls for SOLID compliance and TDD. A traditional Express
"routes + controllers + models" layout makes both painful: the controller ends
up knowing about Sequelize, validation, transport, business rules and
side-effects at the same time. Conversely, a full Clean Architecture project
(entities / use-cases / interface adapters / frameworks-and-drivers) brings
many files and a learning curve that does not fit the size of the test.

We want an architecture that:

- makes SOLID violations *visible* (so the reviewer can spot them),
- keeps unit tests fast (no real database in `application/`),
- can grow into Clean Architecture later if needed.

## Decision

Adopt a **hexagonal-lite** layout inside `apps/api/src/`:

```
domain/
  entities/         Plain TypeScript classes/types: User, Transaction, etc.
  repositories/     Interfaces (ports) — IUserRepository, ITransactionRepository...

application/
  <feature>/        Use-case classes. One file = one class = one .execute() method.
                    Dependencies declared in the constructor, all of them
                    are interfaces declared in domain/.

infrastructure/
  db/               Sequelize models, migrations, seeders.
  repositories/     Sequelize* implementations of domain repository interfaces.
  crypto/           AesGcmCipher, HmacIndex, BcryptHasher, JwtSigner.
  parsers/          IParser + XlsxParser + CsvParser + ParserRegistry.
  http/             Express server, middlewares.

presentation/
  controllers/      Thin: validate input (Zod), call a use case, map to HTTP.
  routes/           Route -> controller wiring.
  schemas/          Zod schemas.

main.ts             Composition root. The ONLY place that instantiates
                    Sequelize and wires concrete implementations into use cases.
```

### SOLID mapping

| Principle | How |
| --- | --- |
| **S** (single responsibility) | One use case per class. One controller method per route. |
| **O** (open/closed) | Adding a new spreadsheet format (`.ods`) means a new `IParser` registered in `ParserRegistry`. No change to `ImportSpreadsheet`. |
| **L** (Liskov) | `InMemoryUserRepository` (tests) is interchangeable with `SequelizeUserRepository` (prod) under the same `IUserRepository` interface. |
| **I** (interface segregation) | Repository interfaces expose only the methods used by their consumer. No god-interface. |
| **D** (dependency inversion) | `application/` imports *only* from `domain/`. `main.ts` is the single place where Sequelize is imported by use cases. |

### Testing layers

- **Unit (`tests/unit/`)** — instantiate a use case with `InMemoryRepository`
  + fake crypto. Run on every save.
- **Integration (`tests/integration/`)** — instantiate the use case with the
  real Sequelize repository against a test MySQL schema. Asserts SQL behavior.
- **End-to-end (`tests/e2e/`)** — boot the Express app with the same `main.ts`
  wiring, hit it through supertest. One happy path per feature.

## Consequences

### Positive

- Reviewer can read a single file (`ImportSpreadsheet.ts`) and understand the
  whole flow.
- Unit tests run in milliseconds because nothing imports Sequelize.
- We get the *benefits* of Clean Architecture (testability, swappable
  infra) without the *file explosion* (no `data-source`, `interactor`,
  `presenter`, `controller-input`, etc.).

### Negative

- Some duplication between the Sequelize model class and the domain entity
  class. Mitigated by `Sequelize*Repository` doing the mapping in one place.
- No dependency-injection container — we pass dependencies manually in
  `main.ts`. For 10–15 use cases that is fine; would need attention beyond
  ~40.

## Alternatives considered

- **Pure Clean Architecture (entities / use-cases / interface-adapters /
  frameworks)** — overkill for the scope; rejected.
- **Plain Express MVC** — fails SOLID criteria and TDD becomes harder because
  controllers depend on Sequelize.
- **NestJS** — too opinionated, too much framework for the scope of the test.
