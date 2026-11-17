import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';
import { seedMockSession } from '@/test/utils';

function tree(initial: string) {
  return (
    <AuthProvider>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route
            path="/analyst"
            element={
              <RequireAuth>
                <RequireRole role="analyst">
                  <div>Analyst View</div>
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route path="/practitioner" element={<div>Practitioner Home</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('RequireRole', () => {
  beforeEach(() => sessionStorage.clear());

  it('redirects a practitioner away from an analyst-only route to their own home (FR-064)', async () => {
    seedMockSession('practitioner');
    render(tree('/analyst'));
    expect(await screen.findByText('Practitioner Home')).toBeInTheDocument();
    expect(screen.queryByText('Analyst View')).not.toBeInTheDocument();
  });

  it('renders the view when the role matches', async () => {
    seedMockSession('analyst');
    render(tree('/analyst'));
    expect(await screen.findByText('Analyst View')).toBeInTheDocument();
  });
});
