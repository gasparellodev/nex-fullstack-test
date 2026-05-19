# API documentation surface (Swagger UI)

- **Date**: 2026-05-19
- **Status**: Approved
- **Linked issue**: #13
- **Linked PR**: #13

## 1. Context

After PR #12 the API ships ten endpoints that cover the full hiring-test
flow. Reviewers and consumers currently need to read the source to
understand the request and response shapes. We need an interactive
contract document — Swagger UI — so a reviewer can browse the surface,
try requests directly from the browser and inspect schemas without
leaving the page.

## 2. Requirements

### Functional

- [ ] `GET /api/docs` serves a Swagger UI listing every endpoint
  exposed in production, grouped by tag (Auth, Me, Admin, System).
- [ ] `GET /api/docs/openapi.json` returns the raw OpenAPI 3 document.
- [ ] The document declares the `bearerAuth` security scheme and
  marks each protected route with the appropriate requirement.
- [ ] Schemas for the request bodies and response payloads are
  defined under `components.schemas` and reused by reference.

### Non-functional

- [ ] No new runtime cost when the route is not hit; load Swagger UI
  middleware once at boot.
- [ ] Document lives in `src/presentation/docs/openapi.ts` as a
  typed `OpenAPIObject` so the compiler catches schema typos.
- [ ] Available in every environment (no feature flag); production
  deployments protect it via the existing CORS allow-list.

## 3. Design

- New dep: `swagger-ui-express` (+ `@types/swagger-ui-express`).
- Single source-of-truth: `src/presentation/docs/openapi.ts` exporting
  a typed OpenAPI 3.0.3 document.
- `server.ts` calls `swaggerUi.setup(spec)` at `/api/docs` and adds a
  small handler that returns the raw JSON at `/api/docs/openapi.json`.
- README "API surface" table replaced with a link to the live Swagger
  UI plus the static list.

## 4. Test plan

- Boot the API and `GET /api/docs/openapi.json` returns 200 with the
  expected number of paths.
- Open `/api/docs` in a browser to confirm rendering.

## 5. Roll-out

- No migrations. Backwards-compatible.
