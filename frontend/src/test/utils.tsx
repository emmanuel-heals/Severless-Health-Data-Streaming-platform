import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { ToastProvider } from '@/components/feedback/ToastProvider';
import axe from 'axe-core';

/** Fresh QueryClient per test, with retries/stale off for deterministic behaviour. */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 }, mutations: { retry: false } },
  });
}

interface ProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  withAuth?: boolean;
}

/** Render a tree inside the app's real providers (Router + Query + optional Auth + Toasts). */
export function renderWithProviders(ui: ReactElement, { route = '/', withAuth = true, ...options }: ProvidersOptions = {}) {
  const queryClient = makeQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    const inner = (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <ToastProvider>{children}</ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
    return withAuth ? <AuthProvider>{inner}</AuthProvider> : inner;
  }
  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}

/** Seed a signed-in mock session so authenticated views render. Matches MockAuthService. */
export function seedMockSession(role: 'sys_admin' | 'practitioner' | 'analyst') {
  const users = {
    sys_admin: { userId: 'u-admin', name: 'System Admin', email: 'admin@health.local', role },
    practitioner: { userId: 'u-doc-1', name: 'Dr. Sarah Johnson', email: 'sarah.johnson@health.local', role },
    analyst: { userId: 'u-an-1', name: 'Dr. Emily Carter', email: 'emily.carter@health.local', role },
  } as const;
  sessionStorage.setItem('hsp.mock.session', JSON.stringify({ user: users[role], accessToken: 'test.token' }));
}

/** Run axe-core against a container and fail with a readable message on any violation. */
export async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    // These require full-page context jsdom can't provide reliably in a unit test.
    rules: {
      region: { enabled: false },
      'landmark-one-main': { enabled: false },
      'page-has-heading-one': { enabled: false },
      // color-contrast needs canvas rendering jsdom lacks; contrast is governed by the fixed palette.
      'color-contrast': { enabled: false },
    },
  });
  if (results.violations.length > 0) {
    const detail = results.violations
      .map((v) => `• [${v.id}] ${v.help} (${v.nodes.length}) — ${v.nodes[0]?.failureSummary ?? ''}`)
      .join('\n');
    throw new Error(`Expected no accessibility violations but found ${results.violations.length}:\n${detail}`);
  }
}
