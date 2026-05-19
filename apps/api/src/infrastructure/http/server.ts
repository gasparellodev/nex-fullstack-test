import express, { type Express } from 'express';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import type { AdminImportsController } from '@/presentation/controllers/AdminImportsController.js';
import type { AdminTransactionsController } from '@/presentation/controllers/AdminTransactionsController.js';
import type { AuthController } from '@/presentation/controllers/AuthController.js';
import type { MeController } from '@/presentation/controllers/MeController.js';
import type { ITokenSigner } from '@/domain/ports/ITokenSigner.js';
import { buildAuthMiddleware } from '@/infrastructure/http/middlewares/auth.js';
import { buildErrorHandler } from '@/infrastructure/http/middlewares/errorHandler.js';
import { buildRateLimiter } from '@/infrastructure/http/middlewares/rateLimit.js';
import { requireRole } from '@/infrastructure/http/middlewares/role.js';
import {
  buildCors,
  buildSecurityHeaders,
} from '@/infrastructure/http/middlewares/securityHeaders.js';
import { buildAdminRouter } from '@/presentation/routes/admin.routes.js';
import { buildAuthRouter } from '@/presentation/routes/auth.routes.js';
import { buildMeRouter } from '@/presentation/routes/me.routes.js';

export interface BuildAppDeps {
  authController: AuthController;
  meController: MeController;
  adminImportsController: AdminImportsController;
  adminTransactionsController: AdminTransactionsController;
  tokens: ITokenSigner;
  logger: Logger;
  corsOrigin: string;
  rateLimitAuth: number;
  rateLimitGlobal: number;
}

export function buildApp(deps: BuildAppDeps): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(buildSecurityHeaders());
  app.use(buildCors(deps.corsOrigin));
  app.use(express.json({ limit: '256kb' }));
  app.use(pinoHttp({ logger: deps.logger }));

  // Global rate limiter
  app.use(buildRateLimiter(deps.rateLimitGlobal));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'nex-api' });
  });

  // Auth routes share a tighter rate limit
  const authRouter = buildAuthRouter(
    deps.authController,
    buildRateLimiter(deps.rateLimitAuth),
  );
  app.use('/api/auth', authRouter);

  const authMiddleware = buildAuthMiddleware(deps.tokens);
  app.use('/api/me', buildMeRouter(deps.meController, authMiddleware));
  app.use(
    '/api/admin',
    buildAdminRouter(
      {
        imports: deps.adminImportsController,
        transactions: deps.adminTransactionsController,
      },
      authMiddleware,
      requireRole('admin'),
    ),
  );

  app.use(buildErrorHandler(deps.logger));
  return app;
}
