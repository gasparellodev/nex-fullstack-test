import helmet from 'helmet';
import cors from 'cors';
import type { RequestHandler } from 'express';

export function buildSecurityHeaders(): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  });
}

export function buildCors(origins: string): RequestHandler {
  const allowed = origins.split(',').map((s) => s.trim()).filter(Boolean);
  return cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // server-to-server / curl
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error(`origin ${origin} not allowed`));
    },
    credentials: false,
    maxAge: 600,
  });
}
