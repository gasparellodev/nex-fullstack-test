# Sequence — admin spreadsheet import

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Web as @nex/web
    participant API as Express<br/>route /api/admin/imports
    participant Auth as authMiddleware<br/>+ roleMiddleware('admin')
    participant Ctrl as AdminImportsController
    participant UC as ImportSpreadsheetUseCase
    participant Reg as ParserRegistry
    participant Parser as XlsxParser / CsvParser
    participant UR as IUserRepository
    participant TR as ITransactionRepository
    participant BR as IImportBatchRepository
    participant AL as IAuditLogRepository
    participant DB as MySQL

    Admin->>Web: select file + click "Importar"
    Web->>API: POST /api/admin/imports<br/>multipart/form-data (Bearer JWT)
    API->>Auth: validate token + role
    Auth-->>API: ok (userId, role=admin)
    API->>Ctrl: handle(req)
    Ctrl->>Ctrl: validate (mime, ≤5MB, ≤50k rows)
    Ctrl->>UC: execute({ adminId, buffer, filename })
    UC->>UC: compute sha256(buffer)
    UC->>BR: findByFileSha256(sha256)
    alt batch already exists
        BR-->>UC: previousBatch
        UC-->>Ctrl: previousBatch (imported=0, skipped=[])
        Ctrl-->>API: 200 (idempotent reply)
    else new file
        UC->>Reg: forExtension(filename)
        Reg-->>UC: parser : IParser
        UC->>Parser: parse(buffer)
        Parser-->>UC: ParsedRow[]
        loop for each row
            UC->>UR: findIdByCpfHash(hmac(row.cpf))
            alt user not found
                UC->>UC: skipped.push({row,cpf_masked,reason})
            else found
                UC->>UC: toInsert.push({...row, userId})
            end
        end
        UC->>DB: BEGIN
        UC->>BR: create({adminId,filename,sha256,counts,skipped})
        UC->>TR: bulkInsert(toInsert)
        UC->>AL: log('import.run', batchId, counts)
        UC->>DB: COMMIT
        UC-->>Ctrl: ImportResultDto
        Ctrl-->>API: 200 { batchId, imported, skipped[] }
    end
    API-->>Web: 200 JSON
    Web-->>Admin: render summary "Importadas N, ignoradas M"
```

## Notes

- **Idempotency**: the file's SHA-256 is the deduplication key. Replaying the
  same upload returns the previous batch with `imported=0` and the same
  `skippedRows` payload — no double-spend of points.
- **Transactional**: between the BEGIN and COMMIT the use case writes the
  batch, transactions and audit row. A crash before COMMIT leaves the system
  in its previous state.
- **PII in logs**: only `cpf_masked` (`***.***.300-00`) is logged. The full
  CPF stays in memory just long enough to compute the HMAC.
- **Performance**: bulk insert is a single `INSERT INTO transactions VALUES
  (...), (...), ...` statement, sized to ~500 rows per batch by the
  repository to stay below `max_allowed_packet`.
