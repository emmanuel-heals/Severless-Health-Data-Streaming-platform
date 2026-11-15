import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { ROLE_HOME } from '@/config/roles';
import { authService, AuthError } from '@/services/authService';
import { Brand } from '@/components/Brand';
import { Button } from '@/components/ui/Button';
import styles from './Login.module.css';

/** Forced first-login password change (FR-010, UC-001 A1). Policy is TBC (OI-16). */
export function ChangePassword() {
  const { status, completeNewPassword } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status !== 'new_password_required') {
    navigate('/login', { replace: true });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await completeNewPassword(pw);
      const current = await authService.getCurrentUser();
      if (current) navigate(ROLE_HOME[current.role], { replace: true });
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Could not set the new password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.panel} style={{ gridTemplateColumns: '1fr', maxWidth: 440 }}>
        <main className={styles.right}>
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <Brand />
          </div>
          <h1 className={styles.title}>Set a new password</h1>
          <p className={styles.subtitle}>
            This is your first sign-in. Please choose a new password to continue.
          </p>

          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={submit} noValidate>
            <label className={styles.field}>
              <span className="sr-only">New password</span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="New password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
              />
            </label>
            <label className={styles.field}>
              <span className="sr-only">Confirm new password</span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </label>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
              Password policy to be confirmed (OI-16). Minimum 8 characters for now.
            </p>
            <Button type="submit" block disabled={busy}>
              {busy ? 'Saving…' : 'Set password & continue'}
            </Button>
          </form>
        </main>
      </div>
    </div>
  );
}
