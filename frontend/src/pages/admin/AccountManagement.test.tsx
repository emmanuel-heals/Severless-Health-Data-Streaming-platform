import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { AccountManagement } from './AccountManagement';
import { renderWithProviders, seedMockSession, expectNoA11yViolations } from '@/test/utils';

describe('AccountManagement', () => {
  beforeEach(() => {
    sessionStorage.clear();
    seedMockSession('sys_admin');
  });

  it('lists seeded practitioner accounts and offers create actions', async () => {
    renderWithProviders(<AccountManagement />, { route: '/admin/accounts' });
    expect(await screen.findByText('Dr. Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create practitioner/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create analyst/i })).toBeInTheDocument();
  });

  it('has no accessibility violations once loaded', async () => {
    const { container } = renderWithProviders(<AccountManagement />, { route: '/admin/accounts' });
    await screen.findByText('Dr. Sarah Johnson');
    await expectNoA11yViolations(container);
  });
});
