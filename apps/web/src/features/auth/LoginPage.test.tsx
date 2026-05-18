import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';
import { renderWithProviders } from '@/test/render';
import { useAuthStore } from '@/stores/auth.store';

describe('<LoginPage />', () => {
  it('logs in successfully and stores the session', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/e-mail/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/senha/i), 'correct-horse');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('mock-jwt-token');
    });
  });

  it('renders an error alert on bad credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/e-mail/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/senha/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/e-mail ou senha incorretos/i)).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('shows client-side validation errors when fields are empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(await screen.findByText(/e-mail inválido/i)).toBeInTheDocument();
  });
});
