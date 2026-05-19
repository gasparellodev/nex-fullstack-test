import { Router, type RequestHandler } from 'express';
import type { MeController } from '@/presentation/controllers/MeController.js';

export function buildMeRouter(controller: MeController, authMiddleware: RequestHandler): Router {
  const router = Router();
  router.use(authMiddleware);
  router.get('/', controller.show);
  router.get('/transactions', controller.transactions);
  router.get('/wallet', controller.wallet);
  return router;
}
