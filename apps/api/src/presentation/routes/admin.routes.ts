import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import type { AdminImportsController } from '@/presentation/controllers/AdminImportsController.js';

const UPLOAD_LIMIT_BYTES = 5 * 1024 * 1024;

export function buildAdminRouter(
  importsController: AdminImportsController,
  authMiddleware: RequestHandler,
  adminOnlyMiddleware: RequestHandler,
): Router {
  const router = Router();
  router.use(authMiddleware, adminOnlyMiddleware);

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: UPLOAD_LIMIT_BYTES, files: 1 },
  });

  router.post('/imports', upload.single('file'), importsController.create);
  return router;
}
