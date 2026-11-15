/*
 * Auth abstraction. The rest of the app imports ONLY this module, never a Cognito SDK,
 * so swapping mock <-> Cognito is a single-file change (FR-001, FR-002, FR-007, FR-010).
 *
 * Mock mode lets the SPA run locally without a Cognito user pool. It never stores real
 * passwords (FR-002) and mirrors the Cognito challenge/role flow closely enough for UI dev.
 */
import type { Role } from '@/types/domain';
import { env } from '@/config/env';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export type SignInResult =
  | { kind: 'success'; user: AuthUser; accessToken: string }
  | { kind: 'new_password_required'; challengeToken: string };

export class AuthError extends Error {
  constructor(
    message: string,
    /** generic = the single login error shown to users (FR-009) */
    public generic = true,
    public code?: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface AuthService {
  signIn(username: string, password: string): Promise<SignInResult>;
  completeNewPassword(challengeToken: string, newPassword: string): Promise<SignInResult>;
  signOut(): Promise<void>;
  getAccessToken(): Promise<string | null>;
  getCurrentUser(): Promise<AuthUser | null>;
}

/* -------------------------------------------------------------------------- */
/* Mock implementation                                                        */
/* -------------------------------------------------------------------------- */

const GENERIC_LOGIN_ERROR = 'Incorrect username or password.'; // FR-009 / AC-02

interface MockAccount {
  username: string;
  password: string;
  mustChangePassword: boolean;
  user: AuthUser;
}

// Demo accounts for local development only. Not real credentials.
const mockAccounts: MockAccount[] = [
  {
    username: 'admin',
    password: 'admin',
    mustChangePassword: false,
    user: { userId: 'u-admin', name: 'System Admin', email: 'admin@health.local', role: 'sys_admin' },
  },
  {
    username: 'doctor',
    password: 'doctor',
    mustChangePassword: false,
    user: { userId: 'u-doc-1', name: 'Dr. Sarah Johnson', email: 'sarah.johnson@health.local', role: 'practitioner' },
  },
  {
    username: 'analyst',
    password: 'analyst',
    mustChangePassword: false,
    user: { userId: 'u-an-1', name: 'Dr. Emily Carter', email: 'emily.carter@health.local', role: 'analyst' },
  },
];

const SESSION_KEY = 'hsp.mock.session';
const pendingChallenges = new Map<string, MockAccount>();

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function makeToken(user: AuthUser): string {
  // A fake, non-cryptographic token encoding role — for mock mode only.
  return `mock.${btoa(JSON.stringify({ sub: user.userId, role: user.role }))}.${Date.now()}`;
}

class MockAuthService implements AuthService {
  async signIn(username: string, password: string): Promise<SignInResult> {
    const acct = mockAccounts.find((a) => a.username === username.trim().toLowerCase());
    // Same generic error whether the user is unknown or the password is wrong (FR-009).
    if (!acct || acct.password !== password) {
      return delay(null).then(() => {
        throw new AuthError(GENERIC_LOGIN_ERROR);
      });
    }
    if (acct.mustChangePassword) {
      const challengeToken = makeToken(acct.user);
      pendingChallenges.set(challengeToken, acct);
      return delay({ kind: 'new_password_required', challengeToken });
    }
    const accessToken = makeToken(acct.user);
    this.persist(acct.user, accessToken);
    return delay({ kind: 'success', user: acct.user, accessToken });
  }

  async completeNewPassword(challengeToken: string, newPassword: string): Promise<SignInResult> {
    const acct = pendingChallenges.get(challengeToken);
    if (!acct) throw new AuthError('Your session expired. Please sign in again.', false);
    if (newPassword.length < 8) {
      throw new AuthError('Password does not meet the required policy.', false);
    }
    acct.password = newPassword;
    acct.mustChangePassword = false;
    pendingChallenges.delete(challengeToken);
    const accessToken = makeToken(acct.user);
    this.persist(acct.user, accessToken);
    return delay({ kind: 'success', user: acct.user, accessToken });
  }

  async signOut(): Promise<void> {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }

  async getAccessToken(): Promise<string | null> {
    return this.read()?.accessToken ?? null;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.read()?.user ?? null;
  }

  private persist(user: AuthUser, accessToken: string) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, accessToken }));
    } catch {
      /* ignore storage failures */
    }
  }

  private read(): { user: AuthUser; accessToken: string } | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Cognito implementation — placeholder until a user pool is provisioned.      */
/* -------------------------------------------------------------------------- */

class CognitoAuthServiceNotConfigured implements AuthService {
  private fail(): never {
    throw new AuthError(
      'Cognito is not configured. Set VITE_AUTH_MODE=mock for local development, or provide Cognito env values.',
      false,
    );
  }
  signIn(): Promise<SignInResult> {
    return Promise.reject(this.tryFail());
  }
  completeNewPassword(): Promise<SignInResult> {
    return Promise.reject(this.tryFail());
  }
  async signOut(): Promise<void> {
    /* no-op */
  }
  async getAccessToken(): Promise<string | null> {
    return null;
  }
  async getCurrentUser(): Promise<AuthUser | null> {
    return null;
  }
  private tryFail(): AuthError {
    try {
      this.fail();
    } catch (e) {
      return e as AuthError;
    }
    return new AuthError('Cognito not configured', false);
  }
}

export const authService: AuthService =
  env.authMode === 'cognito' ? new CognitoAuthServiceNotConfigured() : new MockAuthService();

export { GENERIC_LOGIN_ERROR };
