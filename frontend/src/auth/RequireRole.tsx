import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ROLE_HOME } from '@/config/roles';
import type { Role } from '@/types/domain';

/**
 * Gate: requires the signed-in user to hold `role`. A mismatch redirects to the
 * user's OWN dashboard (FR-064) — it never renders another role's view. The backend
 * remains the real boundary (FR-005, NFR-SEC-02).
 */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <>{children}</>;
}
