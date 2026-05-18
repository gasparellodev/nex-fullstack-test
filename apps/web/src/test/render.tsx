import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { AppProviders } from '@/app/providers';

interface CustomOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ['/'], ...options }: CustomOptions = {},
): RenderResult {
  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return (
      <AppProviders>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </AppProviders>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
