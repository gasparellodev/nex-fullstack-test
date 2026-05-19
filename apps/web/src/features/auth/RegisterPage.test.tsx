import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterPage } from './RegisterPage';
import { renderWithProviders } from '@/test/render';
import { useAuthStore } from '@/stores/auth.store';

async function fillValidForm(
  user: ReturnType<typeof userEvent.setup>,
  email = 'ana@example.com',
): Promise<void> {
  await user.type(screen.getByLabelText(/nome completo/i), 'Ana Silva');
  await user.type(screen.getByLabelText(/e-mail/i), email);
  await user.type(screen.getByLabelText(/^cpf$/i), '28227930000');
  await user.type(screen.getByLabelText(/^senha$/i), 'correct-horse');
  await user.type(screen.getByLabelText(/confirme a senha/i), 'correct-horse');
  await user.click(screen.getByRole('checkbox', { name: /aceito o tratamento/i }));
}

describe('<RegisterPage />', () => {
  it('registers and stores the session on success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('mock-jwt-token');
    });
  });

  it('surfaces a 409 conflict from the API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await fillValidForm(user, 'taken@example.com');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(
      await screen.findByText(/e-mail ou cpf já cadastrados/i),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('rejects an invalid CPF before calling the API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/nome completo/i), 'Ana Silva');
    await user.type(screen.getByLabelText(/e-mail/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/^cpf$/i), '11111111111');
    await user.type(screen.getByLabelText(/^senha$/i), 'correct-horse');
    await user.type(screen.getByLabelText(/confirme a senha/i), 'correct-horse');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/cpf inválido/i)).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });
});
