import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { AccountPage } from './AccountPage';
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

describe('<AccountPage />', () => {
  it('asks for confirmation before deleting and clears the session', async () => {
    login();
    server.use(
      http.delete(`${API_BASE}/me`, () =>
        HttpResponse.json({ anonymisedEmail: 'deleted-u@nex.invalid' }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(screen.getByRole('button', { name: /quero excluir/i }));
    expect(screen.getByRole('button', { name: /sim, excluir/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /sim, excluir/i }));
    await waitFor(() => expect(useAuthStore.getState().token).toBeNull());
  });

  it('triggers a JSON download on export', async () => {
    login();
    server.use(
      http.post(`${API_BASE}/me/export`, () =>
        HttpResponse.json({
          exportedAt: '2026-05-18T00:00:00.000Z',
          user: { id: 'u' },
          transactions: [],
        }),
      ),
    );
    const createSpy = vi.fn(() => 'blob:fake-url');
    const revokeSpy = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      configurable: true,
      value: createSpy,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      configurable: true,
      value: revokeSpy,
    });
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(screen.getByRole('button', { name: /exportar dados/i }));
    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
  });
});
