# C4 — Container diagram

System: **Nex Digital — full-stack transaction app**.

Mermaid renders this on GitHub directly.

```mermaid
flowchart LR
    subgraph User["End-user browser"]
        Web["@nex/web<br/>(Vite + React + shadcn/ui)<br/>SPA"]
    end

    subgraph Server["Application host (Docker Compose)"]
        API["@nex/api<br/>(Express + sequelize-typescript)<br/>REST + JWT"]
        DB[("MySQL 8.4<br/>users / transactions /<br/>import_batches / audit_logs")]
        Adminer["Adminer<br/>(DB admin UI)"]
    end

    Admin["Admin user"] -- "uploads .xlsx/.csv" --> Web
    Customer["Regular user"] -- "registers / views extract" --> Web
    Web -- "HTTPS (prod) / HTTP (dev)<br/>Bearer JWT" --> API
    API -- "sequelize-typescript<br/>(prepared statements only)" --> DB
    Adminer -. "operator only" .-> DB
```

### Containers

| Container | Tech | Responsibilities |
| --- | --- | --- |
| `@nex/web` | Vite + React 18 + Tailwind + shadcn/ui | Public auth pages; user extract & wallet; admin upload & report. Persists only the JWT in `localStorage`. |
| `@nex/api` | Node 20 + Express + sequelize-typescript | REST surface, auth, parsing, business rules, LGPD endpoints, audit log writes. |
| `MySQL 8.4` | mysql:8.4 | System of record. CPF stored encrypted (AES-256-GCM); password as bcrypt. |
| `Adminer` | adminer:4 | Local-only DB inspector. Not exposed in production. |

### Cross-cutting

- **Logs**: `pino` JSON to stdout; redaction enabled for `password`, `cpf`,
  `authorization`.
- **Secrets**: provided via `.env`; never committed.
- **Crypto envelope** (`LGPD_DATA_KEY`, `LGPD_HMAC_PEPPER`) injected into the
  API container, never exposed to the web container.
