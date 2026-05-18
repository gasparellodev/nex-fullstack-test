# Entity-relationship diagram

```mermaid
erDiagram
    USERS ||--o{ TRANSACTIONS : owns
    USERS ||--o{ AUDIT_LOGS : "is actor of"
    USERS ||--o{ AUDIT_LOGS : "is target of"
    IMPORT_BATCHES ||--o{ TRANSACTIONS : contains
    USERS ||--o{ IMPORT_BATCHES : "uploaded by"

    USERS {
        char(36) id PK
        varchar(120) name
        varchar(180) email "UNIQUE, lowercased"
        varbinary cpf_encrypted "AES-256-GCM"
        char(64) cpf_hash "UNIQUE, HMAC-SHA256"
        varchar(72) password_hash "bcrypt cost 12"
        enum role "admin | user"
        datetime consent_at
        datetime deleted_at "soft delete"
        datetime created_at
        datetime updated_at
    }

    TRANSACTIONS {
        char(36) id PK
        char(36) user_id FK
        varchar(255) description "FULLTEXT idx for admin filter"
        date occurred_at
        bigint points
        bigint amount_cents
        enum status "approved | rejected | pending"
        char(36) import_batch_id FK
        datetime created_at
        datetime updated_at
    }

    IMPORT_BATCHES {
        char(36) id PK
        char(36) admin_id FK
        varchar(255) filename
        char(64) file_sha256 "UNIQUE - idempotency"
        int total_rows
        int imported_rows
        json skipped_rows
        datetime created_at
    }

    AUDIT_LOGS {
        char(36) id PK
        char(36) actor_id FK
        varchar(80) action "import.run, report.view, lgpd.export, lgpd.delete"
        char(36) target_user_id FK "nullable"
        json metadata
        datetime created_at
    }
```

## Indices

| Table | Index | Purpose |
| --- | --- | --- |
| `users` | `(email)` UNIQUE | login |
| `users` | `(cpf_hash)` UNIQUE | spreadsheet lookup, registration uniqueness |
| `transactions` | `(user_id, status)` | wallet query |
| `transactions` | `(user_id, occurred_at)` | user extract |
| `transactions` | `(occurred_at, status, amount_cents)` | admin report filters |
| `transactions` | FULLTEXT `(description)` | admin "product" filter |
| `import_batches` | `(file_sha256)` UNIQUE | idempotent uploads |

## Conventions

- Primary keys are `CHAR(36)` storing UUID v4 generated server-side. Avoids
  enumeration attacks and keeps inserts roughly sequential when ordered by
  `created_at`.
- Money is stored as `BIGINT amount_cents` to avoid IEEE-754 drift.
- Points are stored as `BIGINT` — the spreadsheet uses `"10,000"` which the
  parser normalises to integer `10000`.
- `occurred_at` is `DATE` (not `DATETIME`) because the source spreadsheet
  carries no time component.
