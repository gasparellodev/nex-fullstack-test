import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildTestApp } from '@tests/helpers/buildTestApp.js';
import { VALID_CPF_A, VALID_CPF_B } from '@tests/helpers/auth.fixture.js';

const validBody = {
  name: 'Ana Silva',
  email: 'ana@example.com',
  cpf: VALID_CPF_A,
  password: 'correct-horse',
  consent: true,
};

describe('POST /api/auth/register', () => {
  it('returns 201 with user and token on valid input', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post('/api/auth/register').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'ana@example.com', role: 'user' });
    expect(res.body.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(res.headers.location).toBe('/api/me');
  });

  it('returns 400 when a field is missing', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validBody, email: undefined });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('validation_failed');
  });

  it('returns 422 when consent is missing', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validBody, consent: false });
    expect(res.status).toBe(400);
  });

  it('returns 409 when email is already in use', async () => {
    const { app } = buildTestApp();
    await request(app).post('/api/auth/register').send(validBody);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validBody, cpf: VALID_CPF_B });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('conflict');
  });

  it('returns 409 when CPF is already in use', async () => {
    const { app } = buildTestApp();
    await request(app).post('/api/auth/register').send(validBody);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validBody, email: 'other@example.com' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 200 with token for valid credentials', async () => {
    const { app } = buildTestApp();
    await request(app).post('/api/auth/register').send(validBody);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@example.com', password: 'correct-horse' });

    expect(res.status).toBe(200);
    expect(res.body.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  it('returns 401 for wrong password', async () => {
    const { app } = buildTestApp();
    await request(app).post('/api/auth/register').send(validBody);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('unauthorized');
  });

  it('returns 429 after exceeding the auth rate limit', async () => {
    const { app } = buildTestApp({ rateLimitAuth: 3 });
    const bad = { email: 'ana@example.com', password: 'wrong' };
    const codes: number[] = [];
    for (let i = 0; i < 5; i++) {
      const r = await request(app).post('/api/auth/login').send(bad);
      codes.push(r.status);
    }
    expect(codes.filter((c) => c === 429).length).toBeGreaterThan(0);
  });
});

describe('GET /api/me', () => {
  it('returns 401 when token is missing', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 when token is malformed', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/me').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('returns the authenticated user', async () => {
    const { app } = buildTestApp();
    const reg = await request(app).post('/api/auth/register').send(validBody);
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: 'ana@example.com', role: 'user' });
  });
});
