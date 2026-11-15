import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '@/services/authService';
import type { AuthUser } from '@/services/authService';

type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated' | 'new_password_required';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  signIn: (username: string, password: string) => Promise<void>;
  completeNewPassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  // Restore an existing session on load.
  useEffect(() => {
    let active = true;
    authService
      .getCurrentUser()
      .then((u) => {
        if (!active) return;
        if (u) {
          setUser(u);
          setStatus('authenticated');
        } else {
          setStatus('unauthenticated');
        }
      })
      .catch(() => active && setStatus('unauthenticated'));
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const result = await authService.signIn(username, password);
    if (result.kind === 'new_password_required') {
      setChallengeToken(result.challengeToken);
      setStatus('new_password_required');
      return;
    }
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const completeNewPassword = useCallback(
    async (newPassword: string) => {
      if (!challengeToken) throw new Error('No pending password challenge.');
      const result = await authService.completeNewPassword(challengeToken, newPassword);
      if (result.kind === 'success') {
        setChallengeToken(null);
        setUser(result.user);
        setStatus('authenticated');
      }
    },
    [challengeToken],
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setChallengeToken(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, completeNewPassword, signOut }),
    [status, user, signIn, completeNewPassword, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
