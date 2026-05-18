import pino, { type Logger, type LoggerOptions } from 'pino';

const baseOptions: LoggerOptions = {
  redact: {
    paths: [
      'password',
      'cpf',
      '*.password',
      '*.cpf',
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.cpf',
      'res.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
  base: { service: 'nex-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
};

export function createLogger(level: LoggerOptions['level'] = 'info', pretty = false): Logger {
  const transport =
    pretty && process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { translateTime: 'SYS:standard' } }
      : undefined;
  return pino({ ...baseOptions, level, ...(transport ? { transport } : {}) });
}
