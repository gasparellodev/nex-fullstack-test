import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import type { AdminImportsController } from '@/presentation/controllers/AdminImportsController.js';
import type { AdminTransactionsController } from '@/presentation/controllers/AdminTransactionsController.js';

const UPLOAD_LIMIT_BYTES = 5 * 1024 * 1024;

export interface AdminRouterDeps {
  imports: AdminImportsController;
  transactions: AdminTransactionsController;
}

export function buildAdminRouter(
  deps: AdminRouterDeps,
  authMiddleware: RequestHandler,
  adminOnlyMiddleware: RequestHandler,
): Router {
  const router = Router();
  router.use(authMiddleware, adminOnlyMiddleware);

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: UPLOAD_LIMIT_BYTES, files: 1 },
  });

  router.post('/imports', upload.single('file'), deps.imports.create);
  router.get('/transactions', deps.transactions.list);

  return router;
}
