# ADR-002: LGPD-aligned protection for personal data

- **Date**: 2026-05-18
- **Status**: Accepted

## Context

The application stores **CPF** (a Brazilian government-issued personal
identifier) alongside name, e-mail, transaction history and audit metadata.
Under LGPD (Brazil's General Data Protection Law) CPF is *personal data*
and must be protected at rest, accessible to its owner, and erasable on
request. The user asked for a pragmatic-but-honest implementation, not a full
enterprise compliance programme.

We need to balance three tensions:

1. **Encrypt at rest** — but Sequelize/MySQL also need to *find* a row by
   CPF when ingesting the spreadsheet, so a pure ciphertext column will not
   support `WHERE`.
2. **Right of access and erasure** — the user must be able to download their
   data and to disappear from the system without breaking referential
   integrity for legitimate accounting purposes (transactions, audit logs).
3. **Cost of mistakes** — leaking a CPF list from `users` is the worst
   outcome, so we accept extra complexity to prevent it.

## Decision

### Storage scheme for CPF

| Column | Type | Content |
| --- | --- | --- |
| `cpf_encrypted` | `VARBINARY(255)` | `AES-256-GCM(cpf_digits, LGPD_DATA_KEY, iv)` with a fresh IV per row. The IV and authentication tag are prefixed to the ciphertext. |
| `cpf_hash` | `CHAR(64) UNIQUE` | `HMAC-SHA256(cpf_digits, LGPD_HMAC_PEPPER)` hex-encoded. Used to enforce uniqueness and to look the user up from the spreadsheet. |

`LGPD_DATA_KEY` and `LGPD_HMAC_PEPPER` come from environment variables, never
from the database. The key must be 32 bytes (HEX `64` chars). Rotating keys
requires a re-encryption migration; out of scope for the test.

### Password storage

`bcryptjs` with cost factor 12. Never stored in any other form.

### Application controls

- `helmet` with strict CSP defaults.
- `express-rate-limit`: global 100 req/min, `/auth/*` capped at 5 req/min.
- CORS allow-list from `API_CORS_ORIGIN`; no wildcard.
- Pino `redact` of `password`, `cpf`, `authorization` headers and any
  `req.body.*` matching the same names.
- Soft-delete (`users.deleted_at`) so that historical transactions still
  reference a valid row.

### LGPD endpoints

| Method | Path | Behavior |
| --- | --- | --- |
| `POST` | `/api/me/export` | Returns a JSON dump of the caller's personal data (decrypted CPF, transactions, audit entries that mention them). Writes an `audit_log` entry with `action='lgpd.export'`. |
| `DELETE` | `/api/me` | Soft-deletes the user, anonymises the e-mail to `deleted-<uuid>@nex.invalid`, zeroes `cpf_encrypted` and `cpf_hash`, and invalidates the user's JWT. Writes `action='lgpd.delete'`. |

### Audit log

Every admin action that touches personal data writes a row to `audit_logs`:

- `import.run` — admin uploaded a spreadsheet.
- `report.view` — admin queried the report.
- `lgpd.export` / `lgpd.delete` — see above.

## Consequences

### Positive

- Even with a full dump of the `users` table, CPFs are unreadable without the
  KEK.
- The HMAC index gives O(1) lookups on CPF while never leaking the value to
  anyone who can read MySQL.
- LGPD rights of access and erasure are *implemented*, not just claimed.
- Logs no longer leak CPF/passwords, which is the most frequent source of
  PII breaches.

### Negative

- Two crypto envs (`LGPD_DATA_KEY`, `LGPD_HMAC_PEPPER`) become hard
  dependencies — wrong values break login.
- HMAC index means a peppered hash collision is *theoretically* possible; in
  practice 256 bits is fine.
- Soft-delete adds default scopes everywhere; tests must opt in to unscoped
  queries.
- "Delete me" cannot delete the user's transactions outright — they remain
  with a tombstone user. We document this in the privacy notice.

## Alternatives considered

- **Plain-text CPF + bcrypt password** — minimal effort, fails the LGPD bar.
- **AES on the entire users row** — works but breaks every other `WHERE`
  clause; over-engineered for the test.
- **Hash-only (no encryption)** — irreversible, but then `/me/export` cannot
  return the CPF to its owner. Rejected.
