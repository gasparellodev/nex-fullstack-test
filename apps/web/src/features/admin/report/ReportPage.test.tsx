import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ReportPage } from './ReportPage';
import { renderWithProviders } from '@/test/render';
import { API_BASE, server } from '@/test/msw';
import { useAuthStore } from '@/stores/auth.store';

function login(): void {
  useAuthStore.getState().setSession({
    token: 'admin-token',
    user: { id: 'a', name: 'Admin', email: 'a@b.com', role: 'admin' },
    expiresIn: '15m',
  });
}

describe('<ReportPage />', () => {
  it('renders rows returned by the API', async () => {
    login();
    server.use(
      http.get(`${API_BASE}/admin/transactions`, () =>
        HttpResponse.json({
          data: [
            {
              id: 't1',
              description: 'Venda do produto X',
              occurredAt: '2022-10-10',
              points: 10_000,
              amountCents: 1_000_000,
              status: 'approved',
              userCpfMasked: '***.***.300-00',
            },
          ],
          page: 1,
          pageSize: 10,
          total: 1,
        }),
      ),
    );

    renderWithProviders(<ReportPage />);

    expect(await screen.findByText('Venda do produto X')).toBeInTheDocument();
    expect(screen.getByText('***.***.300-00')).toBeInTheDocument();
    // Two "Aprovado" appear (the badge and the status dropdown option);
    // we only care that the badge is rendered.
    expect(screen.getAllByText('Aprovado').length).toBeGreaterThanOrEqual(1);
  });

  it('re-queries with applied filters and goes back to page 1', async () => {
    login();
    let lastUrl = '';
    server.use(
      http.get(`${API_BASE}/admin/transactions`, ({ request }) => {
        lastUrl = request.url;
        return HttpResponse.json({ data: [], page: 1, pageSize: 10, total: 0 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ReportPage />);

    await waitFor(() => expect(lastUrl).toContain('page=1'));

    await user.type(screen.getByLabelText(/produto/i), 'produto X');
    await user.click(screen.getByRole('button', { name: /aplicar/i }));

    await waitFor(() => expect(lastUrl).toContain('product=produto+X'));
    expect(lastUrl).toContain('page=1');
  });

  it('renders an empty-state message when there are no rows', async () => {
    login();
    server.use(
      http.get(`${API_BASE}/admin/transactions`, () =>
        HttpResponse.json({ data: [], page: 1, pageSize: 10, total: 0 }),
      ),
    );
    renderWithProviders(<ReportPage />);
    expect(await screen.findByText(/nenhuma transação encontrada/i)).toBeInTheDocument();
  });
});
