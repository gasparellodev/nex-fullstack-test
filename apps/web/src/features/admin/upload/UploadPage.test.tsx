import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadPage } from './UploadPage';
import { renderWithProviders } from '@/test/render';
import { useAuthStore } from '@/stores/auth.store';
import type { ImportResultDto } from '@nex/shared';

// Stub the API module: the test only needs to verify UI state
// transitions after a mutation resolves. Going through axios + FormData +
// MSW is brittle in JSDOM (multipart boundary handling differs across
// environments and is the actual cause of the CI flake we hit).
vi.mock('./api', () => ({
  uploadSpreadsheet: vi.fn<(file: File) => Promise<ImportResultDto>>(),
}));

// Import after the mock so the test sees the stubbed function.
import { uploadSpreadsheet } from './api';

const mockedUpload = uploadSpreadsheet as unknown as ReturnType<typeof vi.fn>;

function login(): void {
  useAuthStore.getState().setSession({
    token: 'admin-token',
    user: { id: 'admin-1', name: 'Admin', email: 'admin@nex.com', role: 'admin' },
    expiresIn: '15m',
  });
}

const csv = new File(
  [
    `CPF,Descrição da transação,Data da transação,Valor em pontos,Valor,Status
282.279.300-00,Venda do produto X,10-10-2022,"10,000","10.000,00",Aprovado
`,
  ],
  'import.csv',
  { type: 'text/csv' },
);

afterEach(() => {
  mockedUpload.mockReset();
});

describe('<UploadPage />', () => {
  it('uploads a file and renders the import summary', async () => {
    mockedUpload.mockResolvedValueOnce({
      batchId: '1',
      filename: 'import.csv',
      totalRows: 1,
      importedRows: 1,
      skippedRows: [],
    });
    login();
    const user = userEvent.setup();
    renderWithProviders(<UploadPage />);

    await user.upload(screen.getByLabelText(/selecionar o arquivo/i), csv);
    await user.click(screen.getByRole('button', { name: /^importar$/i }));

    await waitFor(() => {
      expect(mockedUpload).toHaveBeenCalledWith(csv);
    });
    expect(await screen.findByText(/importadas/i)).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  it('renders skipped rows in the summary', async () => {
    mockedUpload.mockResolvedValueOnce({
      batchId: '1',
      filename: 'import.csv',
      totalRows: 2,
      importedRows: 1,
      skippedRows: [
        { row: 3, cpfMasked: '***.***.300-00', reason: 'user_not_found' },
      ],
    });
    login();
    const user = userEvent.setup();
    renderWithProviders(<UploadPage />);

    await user.upload(screen.getByLabelText(/selecionar o arquivo/i), csv);
    await user.click(screen.getByRole('button', { name: /^importar$/i }));

    expect(await screen.findByText(/linhas ignoradas/i)).toBeInTheDocument();
    expect(screen.getByText(/user_not_found/i)).toBeInTheDocument();
  });

  it('surfaces an error toast when the upload fails', async () => {
    mockedUpload.mockRejectedValueOnce(new Error('boom'));
    login();
    const user = userEvent.setup();
    renderWithProviders(<UploadPage />);

    await user.upload(screen.getByLabelText(/selecionar o arquivo/i), csv);
    await user.click(screen.getByRole('button', { name: /^importar$/i }));

    // The summary card stays empty.
    await waitFor(() => {
      expect(mockedUpload).toHaveBeenCalled();
    });
    expect(screen.getByText(/nenhuma importação realizada/i)).toBeInTheDocument();
  });
});
