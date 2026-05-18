import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  API_LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  API_CORS_ORIGIN: z.string().min(1),

  MYSQL_HOST: z.string().min(1),
  MYSQL_PORT: z.coerce.number().int().positive().default(3306),
  MYSQL_DATABASE: z.string().min(1),
  MYSQL_USER: z.string().min(1),
  MYSQL_PASSWORD: z.string().min(1),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),

  LGPD_DATA_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'LGPD_DATA_KEY must be 64 hex characters (32 bytes)'),
  LGPD_HMAC_PEPPER: z.string().min(16, 'LGPD_HMAC_PEPPER must be at least 16 characters'),

  RATE_LIMIT_AUTH: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_GLOBAL: z.coerce.number().int().positive().default(100),

  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_NAME: z.string().min(1),
  ADMIN_CPF: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n  ');
    throw new Error(`Invalid environment configuration:\n  ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function env(): Env {
  if (!cached) cached = loadEnv();
  return cached;
}

export function resetEnvForTests(): void {
  cached = undefined;
}
