/*
 * Account-management data access (sys_admin). Mirrors the SRS REST contract (§4.3):
 *   GET  /accounts
 *   POST /accounts
 *   POST /accounts/{userId}/deactivate
 *
 * Two implementations behind one interface:
 *  - MockAccountsService: in-memory, for frontend-only development (no backend).
 *  - ApiAccountsService:  real HTTP via apiClient, used when VITE_AUTH_MODE=cognito.
 *
 * The UI imports only `accountsService`, so switching to the real backend touches nothing else.
 */
import type { Role, UserAccount } from '@/types/domain';
import { env } from '@/config/env';
import { apiClient } from './apiClient';
import type { ApiError } from './apiClient';

/** Roles the sys_admin may create — never sys_admin (FR-019, BR-04). */
export type CreatableRole = Extract<Role, 'practitioner' | 'analyst'>;

export interface CreateAccountInput {
  name: string;
  email: string;
  role: CreatableRole;
}

export interface AccountsService {
  list(): Promise<UserAccount[]>;
  create(input: CreateAccountInput): Promise<UserAccount>;
  deactivate(userId: string): Promise<UserAccount>;
}

/* -------------------------------------------------------------------------- */
/* Mock implementation                                                        */
/* -------------------------------------------------------------------------- */

function iso(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

let seed: UserAccount[] = [
  { userId: 'u-doc-1', name: 'Dr. Sarah Johnson', email: 'sarah.johnson@health.org', role: 'practitioner', status: 'Active', createdAt: iso(40), createdBy: 'u-admin' },
  { userId: 'u-doc-2', name: 'Dr. Michael Chen', email: 'michael.chen@health.org', role: 'practitioner', status: 'Active', createdAt: iso(31), createdBy: 'u-admin' },
  { userId: 'u-doc-3', name: 'Dr. Aisha Bello', email: 'aisha.bello@health.org', role: 'practitioner', status: 'Deactivated', createdAt: iso(90), createdBy: 'u-admin', deactivatedAt: iso(5), deactivatedBy: 'u-admin' },
  { userId: 'u-an-1', name: 'Dr. Emily Carter', email: 'emily.carter@health.org', role: 'analyst', status: 'Active', createdAt: iso(28), createdBy: 'u-admin' },
  { userId: 'u-an-2', name: 'James Okoro', email: 'james.okoro@health.org', role: 'analyst', status: 'Active', createdAt: iso(12), createdBy: 'u-admin' },
];

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

class MockAccountsService implements AccountsService {
  async list(): Promise<UserAccount[]> {
    return delay(seed.map((a) => ({ ...a })));
  }

  async create(input: CreateAccountInput): Promise<UserAccount> {
    const email = input.email.trim().toLowerCase();
    // Simulate server-side duplicate check (FR-013 / AC-06).
    if (seed.some((a) => a.email.toLowerCase() === email)) {
      const err: ApiError = {
        code: 'EMAIL_IN_USE',
        message: 'This email is already in use.',
        fieldErrors: { email: 'This email is already in use.' },
        status: 409,
      };
      return Promise.reject(err);
    }
    const account: UserAccount = {
      userId: `u-${Math.random().toString(36).slice(2, 9)}`,
      name: input.name.trim(),
      email: input.email.trim(),
      role: input.role,
      status: 'Active',
      createdAt: new Date().toISOString(),
      createdBy: 'u-admin',
    };
    seed = [account, ...seed];
    return delay(account);
  }

  async deactivate(userId: string): Promise<UserAccount> {
    const idx = seed.findIndex((a) => a.userId === userId);
    if (idx === -1) {
      return Promise.reject({ code: 'NOT_FOUND', message: 'Account not found.', status: 404 } as ApiError);
    }
    if (seed[idx].role === 'sys_admin') {
      // Guardrail mirrored client-side; backend is authoritative (FR-019 / AC-07).
      return Promise.reject({ code: 'FORBIDDEN', message: 'sys_admin accounts cannot be deactivated.', status: 403 } as ApiError);
    }
    seed[idx] = { ...seed[idx], status: 'Deactivated', deactivatedAt: new Date().toISOString(), deactivatedBy: 'u-admin' };
    return delay({ ...seed[idx] });
  }
}

/* -------------------------------------------------------------------------- */
/* Real HTTP implementation                                                   */
/* -------------------------------------------------------------------------- */

class ApiAccountsService implements AccountsService {
  async list(): Promise<UserAccount[]> {
    const { data } = await apiClient.get<UserAccount[]>('/accounts');
    return data;
  }
  async create(input: CreateAccountInput): Promise<UserAccount> {
    const { data } = await apiClient.post<UserAccount>('/accounts', input);
    return data;
  }
  async deactivate(userId: string): Promise<UserAccount> {
    const { data } = await apiClient.post<UserAccount>(`/accounts/${encodeURIComponent(userId)}/deactivate`);
    return data;
  }
}

export const accountsService: AccountsService =
  env.authMode === 'cognito' ? new ApiAccountsService() : new MockAccountsService();
