import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import type { AuthResponseDto } from '@nex/shared';

export const API_BASE = 'http://localhost:3000/api';

export const defaultUser: AuthResponseDto = {
  user: { id: 'user-1', name: 'Ana', email: 'ana@example.com', role: 'user' },
  token: 'mock-jwt-token',
  expiresIn: '15m',
};

export const defaultAdmin: AuthResponseDto = {
  user: { id: 'admin-1', name: 'Admin', email: 'admin@nex.com', role: 'admin' },
  token: 'mock-admin-token',
  expiresIn: '15m',
};

export const server = setupServer(
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === 'admin@nex.com' && body.password === 'admin-pass') {
      return HttpResponse.json(defaultAdmin);
    }
    if (body.email === 'ana@example.com' && body.password === 'correct-horse') {
      return HttpResponse.json(defaultUser);
    }
    return HttpResponse.json(
      { code: 'unauthorized', message: 'invalid credentials' },
      { status: 401 },
    );
  }),
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { email: string };
    if (body.email === 'taken@example.com') {
      return HttpResponse.json(
        { code: 'conflict', message: 'email already registered' },
        { status: 409 },
      );
    }
    return HttpResponse.json(defaultUser, { status: 201 });
  }),
);
