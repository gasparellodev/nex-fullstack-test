import rateLimit from 'express-rate-limit';

export function buildRateLimiter(maxPerMinute: number): ReturnType<typeof rateLimit> {
  return rateLimit({
    windowMs: 60_000,
    max: maxPerMinute,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { code: 'rate_limited', message: 'too many requests' },
  });
}
