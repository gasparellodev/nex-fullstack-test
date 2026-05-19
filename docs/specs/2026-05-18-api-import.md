# Spreadsheet import for transactions

- **Date**: 2026-05-18
- **Status**: Approved
- **Linked issue**: #5
- **Linked PR**: #5

## 1. Context

The admin needs to ingest the periodic spreadsheet of transactions
(CPF / description / date / points / amount / status) and have them
attached to the matching user accounts. The application of these rows
is the system of truth for users' wallets and extracts (PRs #9–#10).

Spreadsheet format matches the example in the assignment statement and
accepts both `.xlsx` and `.csv`. Lines whose CPF is not present in
`users` are skipped (reported back to the admin), the rest are inserted
in a single transaction. The whole upload is idempotent on the SHA-256
of the file body so a retry never produces duplicates.

## 2. Requirements

### Functional

- [ ] `POST /api/admin/imports` multipart/form-data, field `file`.
- [ ] Accept `.xlsx` or `.csv` up to 5 MB / 50 000 rows.
- [ ] Detect format by extension and dispatch to the right parser
  (`Strategy`).
- [ ] Normalize per row: CPF (digits only), date (`dd-mm-yyyy` → `Date`),
  points (`"10,000"` → `10000`), amount (`"10.000,00"` → `1000000`
  cents), status (`Aprovado/Reprovado/Em avaliação` →
  `approved/rejected/pending`).
- [ ] Row Zod schema validates every parsed row. Invalid rows are
  reported via `skipped[]` instead of aborting the whole upload.
- [ ] CPF lookup via `cpf_hash` index; if absent → `skipped` reason
  `user_not_found`.
- [ ] Whole batch lives inside `sequelize.transaction(...)`: either all
  rows + the batch + the audit log are persisted, or none are.
- [ ] Re-upload of the exact same file (SHA-256 match) returns the
  previous `batchId` with `importedRows = 0`. No new rows. The skipped
  payload returned is the one from the original run.
- [ ] Endpoint requires `role=admin` (PR #3 middleware).
- [ ] Records `audit_log` action `import.run` with batch id + counts.

### Non-functional

- [ ] No PII (CPF, names) in the API logs — only the row index and
  masked CPF (`***.***.300-00`) where strictly necessary.
- [ ] Bulk insert in chunks of 500 rows to stay below
  `max_allowed_packet` and keep memory bounded.
- [ ] Reject files with the wrong extension/mime in the controller
  before the parser is invoked.

## 3. Design

### New tables

- `transactions` — see ER diagram.
- `import_batches` — `file_sha256 UNIQUE` powers idempotency.
- `audit_logs` — generic actor/action/target/metadata trail.

### Modules

```
domain/entities/{Transaction,ImportBatch,AuditLog}.ts
domain/repositories/{ITransactionRepository,IImportBatchRepository,IAuditLogRepository}.ts
domain/ports/IClock.ts                     (already in shared/clock.ts)

infrastructure/db/models/{TransactionModel,ImportBatchModel,AuditLogModel}.ts
infrastructure/db/migrations/<ts>-create-{transactions,import_batches,audit_logs}.cjs
infrastructure/repositories/Sequelize{Transaction,ImportBatch,AuditLog}Repository.ts
infrastructure/repositories/InMemory{Transaction,ImportBatch,AuditLog}Repository.ts

infrastructure/parsers/IParser.ts          { parse(buffer): ParsedRow[] }
infrastructure/parsers/XlsxParser.ts       SheetJS
infrastructure/parsers/CsvParser.ts        csv-parse
infrastructure/parsers/ParserRegistry.ts   forExtension(filename) → IParser
infrastructure/parsers/rowSchema.ts        Zod schema for one normalised row

application/transactions/ImportSpreadsheet.ts

presentation/controllers/AdminImportsController.ts
presentation/routes/admin.routes.ts
presentation/schemas/import.schemas.ts
```

### Sequence

See [`docs/diagrams/sequence-import.md`](../diagrams/sequence-import.md).

### Status mapping

| Source string | Stored value |
| --- | --- |
| `Aprovado`, `aprovado`, `Approved` | `approved` |
| `Reprovado`, `reprovado`, `Rejected` | `rejected` |
| `Em avaliação`, `em avaliacao`, `Pending` | `pending` |
| anything else | row goes to `skipped[]` with reason `invalid_status` |

### Error mapping

| Reason in `skipped[]` | When |
| --- | --- |
| `invalid_cpf` | check-digit fails |
| `user_not_found` | no row in `users` for that CPF |
| `invalid_status` | status string not in the table above |
| `invalid_date` | unparseable date |
| `invalid_amount` | amount cannot be normalised |
| `invalid_points` | points cannot be normalised |
| `schema_error` | Zod top-level rejection |

## 4. Test plan

- Unit: `CsvParser`, `XlsxParser`, `rowSchema`, `ImportSpreadsheet`
  (using in-memory repos and a fake parser).
- Integration: `POST /api/admin/imports` happy path, idempotent retry,
  rejection of non-admin token, validation of bad extensions/size.

## 5. Roll-out

- 3 new migrations applied in order: transactions, import_batches,
  audit_logs. No conflict with existing schema.
