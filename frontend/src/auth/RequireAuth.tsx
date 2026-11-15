import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';

/** Gate: requires an authenticated session (FR-005 at the UI layer). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageLoader label="Loading…" />;
  if (status === 'new_password_required') return <Navigate to="/change-password" replace />;
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
