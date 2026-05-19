import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ExtractPage } from './ExtractPage';
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

describe('<ExtractPage />', () => {
  it('renders user transactions and forwards filters', async () => {
    login();
    let lastUrl = '';
    server.use(
      http.get(`${API_BASE}/me/transactions`, ({ request }) => {
        lastUrl = request.url;
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        return HttpResponse.json({
          data:
            status === 'approved'
              ? [
                  {
                    id: 't1',
                    description: 'Venda do produto X',
                    occurredAt: '2022-10-10',
                    points: 10_000,
                    amountCents: 1_000_000,
                    status: 'approved',
                  },
                ]
              : [],
          page: 1,
          pageSize: 10,
          total: status === 'approved' ? 1 : 0,
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ExtractPage />);
    expect(await screen.findByText(/nenhuma transação encontrada/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/status/i), 'approved');
    await user.click(screen.getByRole('button', { name: /aplicar/i }));

    expect(await screen.findByText('Venda do produto X')).toBeInTheDocument();
    expect(lastUrl).toContain('status=approved');
  });
});
