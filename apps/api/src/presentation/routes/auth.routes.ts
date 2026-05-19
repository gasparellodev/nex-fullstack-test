import { Router, type RequestHandler } from 'express';
import type { AuthController } from '@/presentation/controllers/AuthController.js';

export function buildAuthRouter(
  controller: AuthController,
  rateLimiter: RequestHandler,
): Router {
  const router = Router();
  router.use(rateLimiter);
  router.post('/register', controller.register);
  router.post('/login', controller.login);
  return router;
}
