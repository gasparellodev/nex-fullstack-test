import { Router, type RequestHandler } from 'express';
import type { LgpdController } from '@/presentation/controllers/LgpdController.js';
import type { MeController } from '@/presentation/controllers/MeController.js';

export interface MeRouterDeps {
  me: MeController;
  lgpd: LgpdController;
}

export function buildMeRouter(deps: MeRouterDeps, authMiddleware: RequestHandler): Router {
  const router = Router();
  router.use(authMiddleware);
  router.get('/', deps.me.show);
  router.get('/transactions', deps.me.transactions);
  router.get('/wallet', deps.me.wallet);
  router.post('/export', deps.lgpd.export);
  router.delete('/', deps.lgpd.remove);
  return router;
}
