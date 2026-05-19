import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { UploadPage } from './UploadPage';
import { renderWithProviders } from '@/test/render';
import { API_BASE, server } from '@/test/msw';
import { useAuthStore } from '@/stores/auth.store';

const csv = new File(
  [
    `CPF,Descrição da transação,Data da transação,Valor em pontos,Valor,Status
282.279.300-00,Venda do produto X,10-10-2022,"10,000","10.000,00",Aprovado
`,
  ],
  'import.csv',
  { type: 'text/csv' },
);

function login(): void {
  useAuthStore.getState().setSession({
    token: 'admin-token',
    user: { id: 'admin-1', name: 'Admin', email: 'admin@nex.com', role: 'admin' },
    expiresIn: '15m',
  });
}

describe('<UploadPage />', () => {
  it('uploads a file and renders the import summary', async () => {
    server.use(
      http.post(`${API_BASE}/admin/imports`, () =>
        HttpResponse.json(
          {
            batchId: '1',
            filename: 'import.csv',
            totalRows: 1,
            importedRows: 1,
            skippedRows: [],
          },
          { status: 200 },
        ),
      ),
    );
    login();
    const user = userEvent.setup();
    renderWithProviders(<UploadPage />);

    await user.upload(screen.getByLabelText(/selecionar o arquivo/i), csv);
    await user.click(screen.getByRole('button', { name: /^importar$/i }));

    await waitFor(() => {
      expect(screen.getByText(/importadas/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  it('renders skipped rows in the summary', async () => {
    server.use(
      http.post(`${API_BASE}/admin/imports`, () =>
        HttpResponse.json(
          {
            batchId: '1',
            filename: 'import.csv',
            totalRows: 2,
            importedRows: 1,
            skippedRows: [
              { row: 3, cpfMasked: '***.***.300-00', reason: 'user_not_found' },
            ],
          },
          { status: 200 },
        ),
      ),
    );
    login();
    const user = userEvent.setup();
    renderWithProviders(<UploadPage />);

    await user.upload(screen.getByLabelText(/selecionar o arquivo/i), csv);
    await user.click(screen.getByRole('button', { name: /^importar$/i }));

    expect(await screen.findByText(/linhas ignoradas/i)).toBeInTheDocument();
    expect(screen.getByText(/user_not_found/i)).toBeInTheDocument();
  });
});
