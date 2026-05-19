import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { WalletPage } from './WalletPage';
import { renderWithProviders } from '@/test/render';
import { API_BASE, server } from '@/test/msw';
import { useAuthStore } from '@/stores/auth.store';

function login(): void {
  useAuthStore.getState().setSession({
    token: 't',
    user: { id: 'u', name: 'Ana', email: 'a@b.com', role: 'user' },
    expiresIn: '15m',
  });
}

describe('<WalletPage />', () => {
  it('renders the balance returned by the API', async () => {
    login();
    server.use(
      http.get(`${API_BASE}/me/wallet`, () => HttpResponse.json({ balancePoints: 10_000 })),
    );
    renderWithProviders(<WalletPage />);
    expect(await screen.findByText('10.000')).toBeInTheDocument();
  });

  it('falls back to an alert on error', async () => {
    login();
    server.use(
      http.get(`${API_BASE}/me/wallet`, () =>
        HttpResponse.json({ code: 'internal_error', message: 'oops' }, { status: 500 }),
      ),
    );
    renderWithProviders(<WalletPage />);
    expect(await screen.findByText(/não foi possível obter o saldo/i)).toBeInTheDocument();
  });
});
