/**
 * OpenAPI 3.0.3 document for the Nex Digital API.
 *
 * Hand-authored on purpose: it doubles as the human-readable contract
 * (linked from the README) and as the input to swagger-ui-express. The
 * shape is typed against `OpenAPIObject` so TypeScript catches typos
 * and missing required fields.
 */

interface SchemaObject {
  type?: string;
  format?: string;
  description?: string;
  enum?: readonly string[];
  example?: unknown;
  items?: SchemaObject | { $ref: string };
  properties?: Record<string, SchemaObject | { $ref: string }>;
  required?: string[];
  additionalProperties?: boolean | SchemaObject;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  nullable?: boolean;
}

interface ResponseObject {
  description: string;
  content?: Record<string, { schema: SchemaObject | { $ref: string } }>;
  headers?: Record<string, { schema: SchemaObject; description?: string }>;
}

interface OperationObject {
  tags: string[];
  summary: string;
  description?: string;
  operationId: string;
  security?: Record<string, string[]>[];
  parameters?: {
    name: string;
    in: 'query' | 'path' | 'header';
    required?: boolean;
    schema: SchemaObject;
    description?: string;
  }[];
  requestBody?: {
    required?: boolean;
    content: Record<string, { schema: SchemaObject | { $ref: string } }>;
  };
  responses: Record<string, ResponseObject>;
}

interface PathItemObject {
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  delete?: OperationObject;
  patch?: OperationObject;
}

interface OpenAPIObject {
  openapi: '3.0.3';
  info: {
    title: string;
    description: string;
    version: string;
    contact?: { name: string; email?: string };
    license?: { name: string };
  };
  servers: { url: string; description?: string }[];
  tags: { name: string; description?: string }[];
  components: {
    securitySchemes: Record<
      string,
      { type: 'http'; scheme: 'bearer'; bearerFormat: 'JWT'; description?: string }
    >;
    schemas: Record<string, SchemaObject>;
  };
  paths: Record<string, PathItemObject>;
}

const errorBody: SchemaObject = {
  type: 'object',
  required: ['code', 'message'],
  properties: {
    code: {
      type: 'string',
      enum: [
        'validation_failed',
        'unauthorized',
        'forbidden',
        'not_found',
        'conflict',
        'rate_limited',
        'unprocessable',
        'internal_error',
      ],
    },
    message: { type: 'string' },
    details: { type: 'object', additionalProperties: true, nullable: true },
  },
};

export const openapi: OpenAPIObject = {
  openapi: '3.0.3',
  info: {
    title: 'Nex Digital API',
    version: '0.1.0',
    description:
      'REST API for the Nex Digital Full-Stack 2 technical test. Implements ' +
      'authentication (JWT HS256), spreadsheet import for transactions, an ' +
      'admin report, user extract and wallet, and LGPD-mandated personal-data ' +
      'export and deletion endpoints. See `docs/adr/` and `docs/specs/` in the ' +
      'repository for the rationale and per-feature specs.',
    contact: { name: 'Vinicius Gasparello' },
    license: { name: 'UNLICENSED' },
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local development' }],
  tags: [
    { name: 'Auth', description: 'Public registration and login.' },
    { name: 'Me', description: 'Endpoints scoped to the authenticated user.' },
    { name: 'Admin', description: 'Endpoints reserved for the admin role.' },
    { name: 'System', description: 'Operational endpoints (health, docs).' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'HS256 JWT. Obtain via `POST /api/auth/login` or `register`.',
      },
    },
    schemas: {
      Error: errorBody,
      AuthUser: {
        type: 'object',
        required: ['id', 'name', 'email', 'role'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'user'] },
        },
      },
      AuthResponse: {
        type: 'object',
        required: ['user', 'token', 'expiresIn'],
        properties: {
          user: { $ref: '#/components/schemas/AuthUser' },
          token: { type: 'string', description: 'HS256 JWT bearer token.' },
          expiresIn: { type: 'string', example: '15m' },
        },
      },
      RegisterBody: {
        type: 'object',
        required: ['name', 'email', 'cpf', 'password', 'consent'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 120 },
          email: { type: 'string', format: 'email', maxLength: 180 },
          cpf: {
            type: 'string',
            description: 'CPF (with or without punctuation). Validated against the mod-11 check.',
            example: '529.982.247-25',
          },
          password: { type: 'string', minLength: 8, maxLength: 128 },
          consent: {
            type: 'boolean',
            description: 'Must be `true`. Required by LGPD before processing the data.',
            example: true,
          },
        },
      },
      LoginBody: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      MeProfile: {
        type: 'object',
        required: ['id', 'name', 'email', 'role', 'consentAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'user'] },
          consentAt: { type: 'string', format: 'date-time' },
        },
      },
      Transaction: {
        type: 'object',
        required: ['id', 'description', 'occurredAt', 'points', 'amountCents', 'status'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          description: { type: 'string' },
          occurredAt: { type: 'string', format: 'date', example: '2022-10-10' },
          points: { type: 'integer', example: 10000 },
          amountCents: {
            type: 'integer',
            description: 'Monetary value in cents.',
            example: 1000000,
          },
          status: { type: 'string', enum: ['approved', 'rejected', 'pending'] },
        },
      },
      AdminTransaction: {
        type: 'object',
        required: [
          'id',
          'description',
          'occurredAt',
          'points',
          'amountCents',
          'status',
          'userCpfMasked',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          description: { type: 'string' },
          occurredAt: { type: 'string', format: 'date' },
          points: { type: 'integer' },
          amountCents: { type: 'integer' },
          status: { type: 'string', enum: ['approved', 'rejected', 'pending'] },
          userCpfMasked: { type: 'string', example: '***.***.300-00' },
        },
      },
      Wallet: {
        type: 'object',
        required: ['balancePoints'],
        properties: {
          balancePoints: {
            type: 'integer',
            description: 'Sum of points across transactions with status=approved.',
          },
        },
      },
      PaginatedTransactions: {
        type: 'object',
        required: ['data', 'page', 'pageSize', 'total'],
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
          total: { type: 'integer' },
        },
      },
      PaginatedAdminTransactions: {
        type: 'object',
        required: ['data', 'page', 'pageSize', 'total'],
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/AdminTransaction' } },
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
          total: { type: 'integer' },
        },
      },
      ImportSkippedRow: {
        type: 'object',
        required: ['row', 'cpfMasked', 'reason'],
        properties: {
          row: { type: 'integer' },
          cpfMasked: { type: 'string' },
          reason: {
            type: 'string',
            enum: [
              'invalid_cpf',
              'invalid_description',
              'invalid_date',
              'invalid_points',
              'invalid_amount',
              'invalid_status',
              'user_not_found',
              'schema_error',
            ],
          },
        },
      },
      ImportResult: {
        type: 'object',
        required: ['batchId', 'filename', 'totalRows', 'importedRows', 'skippedRows'],
        properties: {
          batchId: { type: 'string', format: 'uuid' },
          filename: { type: 'string' },
          totalRows: { type: 'integer' },
          importedRows: {
            type: 'integer',
            description: 'Zero when the file SHA-256 matches a previous batch (idempotent retry).',
          },
          skippedRows: { type: 'array', items: { $ref: '#/components/schemas/ImportSkippedRow' } },
        },
      },
      ExportPayload: {
        type: 'object',
        required: ['exportedAt', 'user', 'transactions'],
        properties: {
          exportedAt: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              email: { type: 'string' },
              cpf: { type: 'string', description: 'Decrypted CPF (LGPD right of access).' },
              role: { type: 'string' },
              consentAt: { type: 'string', format: 'date-time' },
            },
          },
          transactions: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
        },
      },
      DeleteAccountResult: {
        type: 'object',
        required: ['anonymisedEmail'],
        properties: {
          anonymisedEmail: { type: 'string', example: 'deleted-<uuid>@nex.invalid' },
        },
      },
      HealthPayload: {
        type: 'object',
        required: ['status', 'service'],
        properties: {
          status: { type: 'string', enum: ['ok'] },
          service: { type: 'string', enum: ['nex-api'] },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Liveness probe',
        operationId: 'health',
        responses: {
          '200': {
            description: 'Service is up.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthPayload' } } },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description:
          'Creates a user with role=user. The CPF is validated (mod-11), HMAC-indexed and ' +
          'AES-256-GCM encrypted at rest. Returns a freshly issued JWT.',
        operationId: 'register',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } },
          },
        },
        responses: {
          '201': {
            description: 'User created.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
            headers: { Location: { schema: { type: 'string' }, description: 'Always `/api/me`.' } },
          },
          '400': {
            description: 'Validation failed.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '409': {
            description: 'Email or CPF already in use.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '422': {
            description: 'Consent missing.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '429': {
            description: 'Rate limit reached (5 req/min by default).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate a user',
        operationId: 'login',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } },
          },
        },
        responses: {
          '200': {
            description: 'Token issued.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          '401': {
            description: 'Bad credentials. The message is intentionally generic.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '429': {
            description: 'Rate limit reached.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/me': {
      get: {
        tags: ['Me'],
        summary: 'Authenticated profile',
        operationId: 'getMe',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Profile of the bearer.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/MeProfile' } } },
          },
          '401': {
            description: 'Missing or invalid token.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      delete: {
        tags: ['Me'],
        summary: 'LGPD — delete my account',
        description:
          'Anonymises the email to `deleted-<uuid>@nex.invalid`, wipes the encrypted CPF and ' +
          'soft-deletes the row. Writes an `lgpd.delete` audit log entry.',
        operationId: 'deleteMe',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Account anonymised.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/DeleteAccountResult' } },
            },
          },
          '401': {
            description: 'Unauthenticated.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/me/transactions': {
      get: {
        tags: ['Me'],
        summary: 'My transactions',
        operationId: 'listMyTransactions',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['approved', 'rejected', 'pending'] },
          },
          { name: 'fromDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'toDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated transactions for the authenticated user.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PaginatedTransactions' } },
            },
          },
          '401': {
            description: 'Unauthenticated.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/me/wallet': {
      get: {
        tags: ['Me'],
        summary: 'Wallet balance (approved points)',
        operationId: 'getWallet',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current balance.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Wallet' } } },
          },
          '401': {
            description: 'Unauthenticated.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/me/export': {
      post: {
        tags: ['Me'],
        summary: 'LGPD — export my personal data',
        description:
          'Returns a JSON document with the user data (including the decrypted CPF) and the ' +
          'full transaction history. Sent with `Content-Disposition: attachment` so browsers ' +
          'download it directly. Writes an `lgpd.export` audit entry.',
        operationId: 'exportMe',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Export payload (download).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ExportPayload' } } },
            headers: {
              'Content-Disposition': {
                schema: { type: 'string' },
                description: 'attachment; filename="nex-export-<uuid>.json"',
              },
            },
          },
          '401': {
            description: 'Unauthenticated.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/admin/imports': {
      post: {
        tags: ['Admin'],
        summary: 'Upload a transactions spreadsheet (xlsx/csv)',
        description:
          'Idempotent on the SHA-256 of the request body. Rows whose CPF is not registered are ' +
          'reported in `skippedRows` but do not abort the batch. Writes an `import.run` audit entry.',
        operationId: 'createImport',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Import processed (or matched a previous batch on retry).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ImportResult' } } },
          },
          '401': {
            description: 'Unauthenticated.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '403': {
            description: 'Not an admin.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '422': {
            description: 'Invalid file (too big, wrong extension, missing).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/admin/transactions': {
      get: {
        tags: ['Admin'],
        summary: 'Paginated report with filters',
        description:
          'Filters: `cpf` (validated, looked up via HMAC index), `product` (substring on the ' +
          'description, FULLTEXT-friendly), `fromDate`/`toDate` (YYYY-MM-DD), `fromAmount`/' +
          '`toAmount` (reals, converted to cents server-side), `status`. Writes a `report.view` ' +
          'audit entry per query.',
        operationId: 'listAdminTransactions',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'cpf', in: 'query', schema: { type: 'string' } },
          { name: 'product', in: 'query', schema: { type: 'string' } },
          { name: 'fromDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'toDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'fromAmount', in: 'query', schema: { type: 'number', minimum: 0 } },
          { name: 'toAmount', in: 'query', schema: { type: 'number', minimum: 0 } },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['approved', 'rejected', 'pending'] },
          },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated transactions across the whole platform.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedAdminTransactions' },
              },
            },
          },
          '401': {
            description: 'Unauthenticated.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '403': {
            description: 'Not an admin.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
  },
};

export type { OpenAPIObject };
