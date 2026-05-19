import express from 'express';

const app = express();
const port = Number(process.env.API_PORT ?? 3000);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nex-api', version: '0.1.0' });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}`);
});
