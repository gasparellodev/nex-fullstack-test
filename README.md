# Teste Full-Stack 2 — Nex Digital

> **Para o time de recrutamento.** Este README é um passo a passo de avaliação.
> Em ~10 minutos você consegue rodar a aplicação, exercitar todos os fluxos
> exigidos no enunciado e localizar os critérios de avaliação no código.
>
> Repositório privado: <https://github.com/gasparellodev/nex-fullstack-test>
> · Candidato: **Vinicius Henrique Gasparello** · vinygasparello@gmail.com

---

## Sumário

1. [O que foi entregue](#1-o-que-foi-entregue)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Subindo a aplicação](#3-subindo-a-aplicação)
4. [Credenciais e dados de teste](#4-credenciais-e-dados-de-teste)
5. [Roteiro de avaliação (passo a passo)](#5-roteiro-de-avaliação-passo-a-passo)
6. [Critérios da vaga × onde inspecionar](#6-critérios-da-vaga--onde-inspecionar)
7. [Rodando os testes automatizados](#7-rodando-os-testes-automatizados)
8. [Histórico de Issues e PRs no GitHub](#8-histórico-de-issues-e-prs-no-github)
9. [Estrutura do projeto](#9-estrutura-do-projeto)
10. [Solução de problemas](#10-solução-de-problemas)

---

## 1. O que foi entregue

Sistema completo do enunciado — administrador importa planilha de transações
e consulta relatório; usuário comum se cadastra, autentica via JWT, vê extrato
filtrado e carteira de pontos.

Diferenciais técnicos pedidos e implementados:

| Critério | Como atende |
| --- | --- |
| **Código limpo em inglês** | Todo o código + commits em inglês, conventional commits. |
| **SOLID** | Arquitetura hexagonal-lite (`domain → application → infrastructure → presentation`); um caso de uso por classe; DI manual em `main.ts`. |
| **TDD** | 132 testes passando (93 backend + 39 frontend), commits ordenados `test:` → `feat:` → `refactor:`. |
| **SDD** | Spec em `docs/specs/` antes de cada feature; 14 especificações no total. |
| **Git Conventional** | Histórico em `main` com 14 merge-commits, um por PR. Todas as Issues registradas no GitHub. |
| **Performance e segurança** | helmet, CORS strict, rate-limit, bcrypt 12, JWT HS256, índices SQL adequados, bulk insert chunked. |
| **LGPD** | CPF cifrado em AES-256-GCM com HMAC para lookup; endpoints `POST /me/export` e `DELETE /me`; audit log; consentimento explícito. |
| **Docker** | Stack completa em `docker compose up`. Não há setup manual. |
| **Swagger** | UI em `/api/docs`, OpenAPI 3 em `/api/docs/openapi.json`. |

Stack: Node 20 · TypeScript estrito · Express · `sequelize-typescript` · MySQL 8
no backend; Vite + React 18 + TypeScript · React Router · Tailwind + shadcn/ui ·
TanStack Query + Zustand · React Hook Form + Zod no frontend; Vitest + supertest
+ React Testing Library + MSW para testes; pnpm workspaces no monorepo.

---

## 2. Pré-requisitos

| Ferramenta | Versão | Por que |
| --- | --- | --- |
| **Docker Desktop** | 4.30+ | Roda tudo (MySQL, API, Web, Adminer) em containers. |
| `git` | qualquer | Clonar o repositório. |
| `openssl` | qualquer | Gerar os segredos do `.env` (já vem com o macOS e Linux). |
| Um navegador moderno | — | Para abrir a SPA em `http://localhost:5173`. |

**Não é necessário** instalar Node, pnpm ou MySQL na máquina. Todo o ambiente
vive nos containers.

---

## 3. Subindo a aplicação

### 3.1. Clone

```bash
git clone https://github.com/gasparellodev/nex-fullstack-test.git
cd nex-fullstack-test
```

### 3.2. Crie o arquivo `.env` (60 segundos)

```bash
cp .env.example .env
```

Em seguida abra `.env` e substitua **três** placeholders por segredos reais:

```bash
# Cole estes três comandos no terminal e copie cada saída para o .env:
openssl rand -base64 64           # → JWT_SECRET=
openssl rand -hex 32              # → LGPD_DATA_KEY=   (precisa ser hex, 64 chars)
openssl rand -base64 48           # → LGPD_HMAC_PEPPER=
```

> **Por que é necessário?** O CPF é cifrado em repouso com a `LGPD_DATA_KEY`
> e indexado com `LGPD_HMAC_PEPPER`. A API se recusa a bootar com placeholders
> — uma proteção de produção que evita esquecer secrets em deploy.

(Os campos `ADMIN_PASSWORD`, `MYSQL_PASSWORD` etc. já podem ficar nos
valores default do `.env.example`; veja a seção [4](#4-credenciais-e-dados-de-teste).)

### 3.3. Suba o stack

```bash
docker compose up --build -d
```

Na primeira execução o build leva ~3-5 minutos. As execuções seguintes são
quase instantâneas.

### 3.4. Rode as migrations e crie o admin (uma única vez)

```bash
docker compose exec api pnpm db:migrate
docker compose exec api pnpm db:seed
```

Saída esperada:

```
== 2026051801-create-users:        migrated
== 2026051802-create-transactions: migrated
== 2026051803-create-import_batches: migrated
== 2026051804-create-audit_logs:   migrated
== 2026051801-admin:               migrated
```

### 3.5. Verifique se está no ar

| Serviço | URL | O que deve aparecer |
| --- | --- | --- |
| Web (SPA) | http://localhost:5173 | Tela de login redirecionada de `/`. |
| API health | http://localhost:3000/health | `{"status":"ok","service":"nex-api"}` |
| **Swagger UI** | http://localhost:3000/api/docs | Documentação interativa com todos os endpoints. |
| Adminer (DB) | http://localhost:8081 | Login com `Server: mysql`, `Username: nex`, `Password: <MYSQL_PASSWORD do .env>`, `Database: nex`. |

---

## 4. Credenciais e dados de teste

### 4.1. Administrador (criado pelo seeder)

| Campo | Valor |
| --- | --- |
| E-mail | `admin@nex.com` (env `ADMIN_EMAIL`) |
| Senha | valor de `ADMIN_PASSWORD` no seu `.env` (default no `.env.example`: `ChangeMe123!`) |
| CPF | `282.279.300-00` (env `ADMIN_CPF`) |
| Role | `admin` |

### 4.2. Usuário comum

Crie pelo cadastro público em `/register`. **CPF de teste válido** (passa pelo
algoritmo mod-11):

- `529.982.247-25`
- `390.533.447-05`

O CPF do admin (`282.279.300-00`) está reservado, então use um dos acima ao
se cadastrar.

### 4.3. Planilha de exemplo

O arquivo [`docs/sample-import.csv`](./docs/sample-import.csv) contém 6 linhas
com diferentes situações para o admin importar — inclui CPF válido cadastrado,
CPF válido **não** cadastrado (vai para `skippedRows`), e os três status do
enunciado (`Aprovado`, `Reprovado`, `Em avaliação`).

---

## 5. Roteiro de avaliação (passo a passo)

> Reserve ~10 minutos. Cada cenário cobre um critério funcional do enunciado.
> Ao final você terá tocado em todos os endpoints e em todas as páginas.

### Cenário A — Usuário comum se cadastra ⏱ 2 min

1. Abra http://localhost:5173/register
2. Preencha:
   - **Nome:** "Maria Teste"
   - **E-mail:** `maria@teste.com`
   - **CPF:** `529.982.247-25` (o input mascara enquanto você digita)
   - **Senha:** `senha-forte-123`
   - **Confirmar senha:** mesma senha
   - **Aceito o tratamento dos dados (LGPD)** → marque
3. Clique em **Criar conta**.

**Esperado:** redireciona para `/extrato` (área do usuário), tabela vazia
mostrando "Nenhuma transação encontrada". A barra superior mostra o nome,
e há um botão **Sair**.

### Cenário B — Admin importa a planilha ⏱ 2 min

1. Abra outra aba (anônima ajuda) em http://localhost:5173/login
2. Entre como **admin** (`admin@nex.com` / senha do `.env`)
3. Redireciona para `/admin/upload`
4. Clique na área tracejada → selecione [`docs/sample-import.csv`](./docs/sample-import.csv)
5. Clique em **Importar**

**Esperado:**

- Toast verde "Importação concluída: 2 de 6 linhas". (Os outros 4 CPFs não
  têm conta — a Maria que você cadastrou é dona de 1 das linhas porque o CSV
  inclui o CPF dela.)
- O card "Resultado" à direita mostra:
  - Total: 6
  - **Importadas: 2** (verde)
  - **Ignoradas: 4** (âmbar) com a lista de cada linha e o motivo
    (`user_not_found`).
6. **Reenvie o mesmo arquivo** — agora o toast vira "Arquivo já havia sido
   importado anteriormente" e `importadas: 0`. Isso comprova a **idempotência**
   baseada no SHA-256 do arquivo.

### Cenário C — Admin filtra o relatório ⏱ 2 min

1. Clique em **Relatório** no menu (`/admin/relatorio`)
2. Veja as 2 linhas importadas na tabela, com CPF mascarado (`***.***.***-**`)
3. Teste cada filtro:
   - **Status = Aprovado** → mostra só as linhas aprovadas
   - **Produto = "produto X"** → busca por substring na descrição
   - **Data inicial = 01/01/2022, final = 31/12/2022** → todas continuam
   - **Valor mínimo = 5000** → filtra acima de R$ 5.000
   - **CPF** = um CPF cadastrado → filtra só daquele usuário
4. Clique **Aplicar** após cada mudança para refletir no servidor (paginação
   server-side com TanStack Query).

### Cenário D — Usuário vê seu extrato e carteira ⏱ 2 min

1. Volte para a aba da **Maria** (ou logue em http://localhost:5173/login)
2. Vá em **Extrato** (`/extrato`)
3. Aparece a transação atribuída ao CPF dela. Teste os filtros (status e data).
4. Vá em **Carteira** (`/carteira`)
5. O card grande mostra o **saldo de pontos**, contabilizando **somente**
   transações com status `Aprovado` — exatamente o requisito do enunciado.

### Cenário E — Direitos LGPD ⏱ 1 min

1. Como **Maria**, vá em **Minha conta** (`/conta`)
2. **Exportar dados** → baixa um JSON com:
   - Dados pessoais incluindo o CPF **descriptografado** (direito de acesso)
   - Histórico completo de transações
3. **Excluir conta** → confirme. A conta é anonimizada (`deleted-<uuid>@nex.invalid`),
   o CPF cifrado é zerado, e você é desconectado. Tentar logar novamente
   retorna 401.

### Cenário F — API direta via Swagger ⏱ 1 min

1. Abra http://localhost:3000/api/docs
2. Faça login: expanda `POST /api/auth/login` → **Try it out** →
   `{"email": "admin@nex.com", "password": "<senha>"}` → Execute
3. Copie o `token` da resposta
4. Clique em **Authorize** no topo → cole o token → Authorize → Close
5. Agora qualquer endpoint protegido (`GET /api/admin/transactions`, etc.)
   pode ser disparado direto pela UI.

---

## 6. Critérios da vaga × onde inspecionar

Mapeamento direto da grade de avaliação para arquivos e pastas:

### Organização geral do código

- `apps/api/src/` segue camadas estritas: `domain/`, `application/`,
  `infrastructure/`, `presentation/`. Nenhum import cruza para baixo
  (domínio nunca importa infraestrutura).
- `apps/web/src/features/` é organizado por *vertical slices*
  (`auth/`, `extract/`, `wallet/`, `account/`, `admin/upload/`, `admin/report/`).
- Tipos compartilhados entre back e front vivem em `packages/shared/`.

### Padronização de nomes

- Backend em inglês (`ImportSpreadsheet`, `IUserRepository`,
  `transactionModelToEntity`).
- Frontend em inglês também; as **strings de UI** estão em pt-BR (atende o
  usuário final brasileiro).
- ESLint flat config com regra zero-warnings (`--max-warnings=0`).

### Performance e segurança

- `helmet` com CSP; CORS allow-list; `express-rate-limit` (5 req/min em
  `/auth/*`, 100 req/min global).
- bcrypt cost 12; JWT HS256 com expiração de 15 min.
- Senha e CPF redacted no logger (Pino).
- Valores monetários armazenados em **centavos** (BIGINT) — sem floats.
- Bulk insert em chunks de 500 linhas para não estourar `max_allowed_packet`.
- Índices SQL: `(user_id, status)`, `(user_id, occurred_at)`,
  `(occurred_at, status, amount_cents)`, FULLTEXT em `description`,
  UNIQUE em `users.email`, `users.cpf_hash` e `import_batches.file_sha256`
  (este último viabiliza a idempotência).

### Uso correto do Git

- 14 PRs no GitHub, todos mergeados.
- Commits seguem **Conventional Commits** (`feat`, `fix`, `chore`, `docs`,
  `refactor`, `test`).
- Cada PR fecha uma Issue (`Closes #N` no corpo).
- Veja o gráfico de merges com `git log --oneline --graph` localmente.

### Tratamento de erros

- Hierarquia tipada em `apps/api/src/shared/errors.ts`
  (`ValidationError`, `UnauthorizedError`, `ConflictError`, etc.).
- Middleware único em `errorHandler.ts` traduz qualquer erro para o formato
  `{ code, message, details }` consistente.
- `ZodError` → 400 com lista de campos.
- Nenhum stack trace vaza em resposta de produção.

### LGPD — implementação completa

| Controle | Arquivo |
| --- | --- |
| AES-256-GCM para CPF | `infrastructure/crypto/AesGcmCipher.ts` |
| HMAC-SHA256 para lookup | `infrastructure/crypto/HmacIndex.ts` |
| Endpoint export | `application/lgpd/ExportUserData.ts` |
| Endpoint delete | `application/lgpd/DeleteUserAccount.ts` |
| Audit log | `application/transactions/ImportSpreadsheet.ts`, `ListAdminTransactions.ts`, etc. |
| Consentimento | `RegisterUser.ts` rejeita sem `consent: true` |
| Soft-delete + anonimização | `SequelizeUserRepository.anonymise` |
| Rationale | [`docs/adr/ADR-002-lgpd-data-protection.md`](./docs/adr/ADR-002-lgpd-data-protection.md) |

### SOLID — leitura recomendada

Para ver SOLID na prática, comece por:

1. [`docs/adr/ADR-003-hexagonal-lite.md`](./docs/adr/ADR-003-hexagonal-lite.md)
   — o desenho da arquitetura.
2. [`apps/api/src/application/transactions/ImportSpreadsheet.ts`](./apps/api/src/application/transactions/ImportSpreadsheet.ts)
   — exemplo de caso de uso (SRP, DIP), depende só de interfaces.
3. [`apps/api/src/infrastructure/parsers/ParserRegistry.ts`](./apps/api/src/infrastructure/parsers/ParserRegistry.ts)
   — OCP: adicionar `.ods` é criar uma classe nova.
4. [`apps/api/src/main.ts`](./apps/api/src/main.ts) — composição de
   dependências (DI manual), único lugar que conhece o Sequelize.

---

## 7. Rodando os testes automatizados

Você pode ver os 132 testes verdes sem sair do container:

```bash
docker compose exec api pnpm test     # 93 testes (unit + integration)
docker compose exec web pnpm test     # 39 testes (component + schema)
```

Ou na máquina (se tiver `pnpm`):

```bash
pnpm install
pnpm test              # roda os dois workspaces
pnpm test:coverage     # cobertura (>= 80% em statements; >= 90% em application/)
pnpm typecheck         # tsc --noEmit em todos os pacotes
pnpm lint              # ESLint zero-warnings
```

Resumo dos testes:

| Workspace | Quantidade | O que cobre |
| --- | --- | --- |
| `@nex/api` | 93 | CPF mod-11, AES-GCM (encrypt/decrypt/tampering), HMAC, bcrypt, JWT, casos de uso (`RegisterUser`, `AuthenticateUser`, `ImportSpreadsheet` com idempotência, etc.), rotas (auth, /me, admin imports, admin report, lgpd), parsers, mapeamento DATEONLY. |
| `@nex/web` | 39 | Validação Zod, store de autenticação, formatadores, páginas (Login, Register, Upload, Report, Extract, Wallet, Account) com MSW. |

---

## 8. Histórico de Issues e PRs no GitHub

O repositório tem **14 PRs mergeados** + 14 Issues fechadas demonstrando o
fluxo SDD + Conventional Commits ponta-a-ponta. PRs em ordem cronológica:

| PR | Tipo | Descrição |
| --- | --- | --- |
| [#1](https://github.com/gasparellodev/nex-fullstack-test/pull/1) | chore | Scaffold monorepo + Docker + CI |
| [#2](https://github.com/gasparellodev/nex-fullstack-test/pull/2) | docs | SDD bootstrap (ADRs + diagramas) |
| [#3](https://github.com/gasparellodev/nex-fullstack-test/pull/3) | feat(api) | Auth (register/login/JWT/role) |
| [#4](https://github.com/gasparellodev/nex-fullstack-test/pull/4) | feat(web) | Auth pages |
| [#5](https://github.com/gasparellodev/nex-fullstack-test/pull/5) | feat(api) | Spreadsheet import idempotente |
| [#6](https://github.com/gasparellodev/nex-fullstack-test/pull/6) | feat(web) | Admin upload page |
| [#7](https://github.com/gasparellodev/nex-fullstack-test/pull/7) | feat(api) | Admin report |
| [#8](https://github.com/gasparellodev/nex-fullstack-test/pull/8) | feat(web) | Admin report UI |
| [#9](https://github.com/gasparellodev/nex-fullstack-test/pull/9) | feat(api) | User extract & wallet |
| [#10](https://github.com/gasparellodev/nex-fullstack-test/pull/10) | feat(web) | Extract & wallet pages |
| [#11](https://github.com/gasparellodev/nex-fullstack-test/pull/11) | feat | LGPD export & delete |
| [#12](https://github.com/gasparellodev/nex-fullstack-test/pull/12) | docs | README + sample CSV |
| [#25](https://github.com/gasparellodev/nex-fullstack-test/pull/25) | feat(api) | Swagger UI + OpenAPI 3 |
| [#27](https://github.com/gasparellodev/nex-fullstack-test/pull/27) | fix(api) | Mapping DATEONLY → Date no repositório |

Cada PR linka para a **spec correspondente** em `docs/specs/`, traz o checklist
de qualidade (`/security-review`, `/code-review`, `/react-best-practices` para
PRs de TSX) e cita a Issue que fecha.

---

## 9. Estrutura do projeto

```
nex-fullstack-test/
├── apps/
│   ├── api/                       # Backend Node + Express + TypeScript
│   │   ├── src/
│   │   │   ├── domain/            # Entidades + interfaces (sem libs externas)
│   │   │   │   ├── entities/
│   │   │   │   ├── repositories/
│   │   │   │   └── ports/         # IPasswordHasher, ICpfCipher, etc.
│   │   │   ├── application/       # Casos de uso (1 classe = 1 .execute())
│   │   │   │   ├── auth/
│   │   │   │   ├── transactions/
│   │   │   │   └── lgpd/
│   │   │   ├── infrastructure/    # Sequelize, crypto, parsers, HTTP server
│   │   │   │   ├── db/{models,migrations,seeders}
│   │   │   │   ├── repositories/
│   │   │   │   ├── crypto/
│   │   │   │   ├── parsers/
│   │   │   │   └── http/middlewares/
│   │   │   ├── presentation/      # Controllers + Zod schemas + rotas
│   │   │   ├── shared/            # env, logger, errors, cpf, clock
│   │   │   └── main.ts            # Composition root (DI manual)
│   │   └── tests/{unit,integration}/
│   └── web/                       # Frontend Vite + React + TS
│       └── src/
│           ├── app/               # router, providers, layout, ProtectedRoute
│           ├── features/          # auth, extract, wallet, account, admin/*
│           ├── components/ui/     # shadcn (Button, Input, Card, …)
│           ├── lib/               # api-client, formatadores
│           └── stores/            # Zustand
├── packages/
│   └── shared/                    # DTOs e enums compartilhados
├── docs/
│   ├── adr/                       # 3 Architecture Decision Records
│   ├── specs/                     # 14 specs por feature (SDD)
│   ├── diagrams/                  # C4, ER, sequência (Mermaid)
│   └── sample-import.csv          # Planilha de teste
├── docker-compose.yml             # mysql + adminer + api + web
├── .env.example                   # Template de variáveis
└── README.md                      # Este arquivo
```

---

## 10. Solução de problemas

| Sintoma | Causa provável | Como resolver |
| --- | --- | --- |
| `Invalid environment configuration` no boot da API | `.env` ainda tem placeholders | Refaça a seção [3.2](#32-crie-o-arquivo-env-60-segundos). |
| `db:migrate` falha logo após o `up` | MySQL ainda subindo | Aguarde 5-10s; o healthcheck do compose marca quando está pronto. |
| Upload retorna 422 `unsupported file extension` | Arquivo não termina em `.xlsx` ou `.csv` | Renomeie ou use o sample. |
| Upload retorna 200 com `importedRows: 0` | Mesmo arquivo já importado (idempotência por SHA-256) | É o comportamento esperado. Altere o arquivo para um novo upload. |
| Login retorna 429 | Rate limit em `/auth/*` (5 req/min por IP) | Aguarde 1 minuto. Para destravar mais cedo: aumente `RATE_LIMIT_AUTH` no `.env` e reinicie a API. |
| Frontend abre em branco | Cache do Vite quebrado | `docker compose exec web sh -c "rm -rf apps/web/node_modules/.vite" && docker compose restart web` |
| Porta 8080 ocupada | Outra app local usa 8080 | Adminer já está mapeado para `8081`. Se 5173 / 3000 / 3306 também conflitarem, ajuste no `docker-compose.yml`. |

### Resetar o ambiente do zero

```bash
docker compose down -v        # apaga volumes (banco zerado)
docker compose up --build -d
docker compose exec api pnpm db:migrate
docker compose exec api pnpm db:seed
```

### Logs em tempo real

```bash
docker compose logs -f api    # backend
docker compose logs -f web    # vite dev-server
```

---

## Contato

Se algo travar durante a avaliação, ou se quiser que eu apresente algum trecho
ao vivo, me chame:

- **E-mail:** vinygasparello@gmail.com
- **GitHub:** [@gasparellodev](https://github.com/gasparellodev)

Obrigado pela leitura — boa avaliação!
