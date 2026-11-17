import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from './Login';
import { renderWithProviders, expectNoA11yViolations } from '@/test/utils';

describe('Login', () => {
  beforeEach(() => sessionStorage.clear());

  it('renders the sign-in form', () => {
    renderWithProviders(<Login />, { route: '/login' });
    expect(screen.getByPlaceholderText(/username or email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows a single generic error for bad credentials (FR-009)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: '/login' });
    await user.type(screen.getByPlaceholderText(/username or email/i), 'nobody');
    await user.type(screen.getByPlaceholderText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /login/i }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/incorrect username or password/i);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<Login />, { route: '/login' });
    await expectNoA11yViolations(container);
  });
});
