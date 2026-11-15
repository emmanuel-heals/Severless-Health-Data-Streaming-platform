import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { ROLE_HOME } from '@/config/roles';
import { authService, AuthError } from '@/services/authService';
import { env } from '@/config/env';
import { Brand } from '@/components/Brand';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui/Button';
import styles from './Login.module.css';

/** Login for all roles (UC-001/006/013, FR-001). Generic error only (FR-009). */
export function Login() {
  const { signIn, status, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in → go to own dashboard.
  if (status === 'authenticated' && user) {
    navigate(ROLE_HOME[user.role], { replace: true });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(username, password);
      const current = await authService.getCurrentUser();
      if (current) navigate(ROLE_HOME[current.role], { replace: true });
      else navigate('/change-password', { replace: true }); // NEW_PASSWORD_REQUIRED
    } catch (err) {
      // Collapse every auth failure to one generic message (FR-009 / AC-02).
      setError(err instanceof AuthError ? err.message : 'Incorrect username or password.');
    } finally {
      setBusy(false);
    }
  }

  // Dev-only quick fill (mock mode). Not a security feature; hidden under real Cognito.
  function quickFill(u: string, p: string) {
    setUsername(u);
    setPassword(p);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        <aside className={styles.left}>
          <Brand variant="light" />
          <h2 className={styles.tagline}>Better Health. Smarter Insights.</h2>
          <ul className={styles.features}>
            <li>
              <Icon name="check" size={18} /> Real-time health data
            </li>
            <li>
              <Icon name="check" size={18} /> Advanced analytics
            </li>
            <li>
              <Icon name="check" size={18} /> Secure &amp; reliable
            </li>
          </ul>
        </aside>

        <main className={styles.right}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to access your dashboard</p>

          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={submit} noValidate>
            <label className={styles.field}>
              <span className="sr-only">Username or email</span>
              <Icon name="users" size={18} />
              <input
                type="text"
                autoComplete="username"
                placeholder="Username or Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              <span className="sr-only">Password</span>
              <Icon name="lock" size={18} />
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.pwToggle}
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </label>

            <Button type="submit" block disabled={busy}>
              {busy ? 'Signing in…' : 'Login'}
            </Button>
          </form>

          {env.authMode === 'mock' && (
            <div className={styles.demo}>
              <span className={styles.demoLabel}>Demo sign-in (mock mode)</span>
              <div className={styles.demoButtons}>
                <button type="button" onClick={() => quickFill('admin', 'admin')}>
                  Administrator
                </button>
                <button type="button" onClick={() => quickFill('doctor', 'doctor')}>
                  Doctor
                </button>
                <button type="button" onClick={() => quickFill('analyst', 'analyst')}>
                  Analyst
                </button>
              </div>
            </div>
          )}

          <p className={styles.foot}>Secure Healthcare Platform · Powered by AWS</p>
        </main>
      </div>
    </div>
  );
}
