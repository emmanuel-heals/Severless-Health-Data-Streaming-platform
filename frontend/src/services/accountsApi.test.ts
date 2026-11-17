import { describe, it, expect } from 'vitest';
import { accountsService } from './accountsApi';
import type { ApiError } from './apiClient';

describe('accounts mock service', () => {
  it('lists seeded practitioner and analyst accounts', async () => {
    const list = await accountsService.list();
    expect(list.some((a) => a.role === 'practitioner')).toBe(true);
    expect(list.some((a) => a.role === 'analyst')).toBe(true);
    // No sys_admin is ever listed as a manageable account.
    expect(list.some((a) => a.role === 'sys_admin')).toBe(false);
  });

  it('creates a new analyst account', async () => {
    const created = await accountsService.create({ name: 'Test Analyst', email: `t${Date.now()}@health.org`, role: 'analyst' });
    expect(created.role).toBe('analyst');
    expect(created.status).toBe('Active');
    expect(created.userId).toBeTruthy();
  });

  it('rejects a duplicate email with a field error (AC-06)', async () => {
    const list = await accountsService.list();
    const existing = list[0].email;
    await expect(accountsService.create({ name: 'Dup', email: existing, role: 'practitioner' })).rejects.toMatchObject({
      status: 409,
      fieldErrors: { email: expect.any(String) },
    } satisfies Partial<ApiError>);
  });

  it('deactivates an active account', async () => {
    const list = await accountsService.list();
    const active = list.find((a) => a.status === 'Active')!;
    const result = await accountsService.deactivate(active.userId);
    expect(result.status).toBe('Deactivated');
    expect(result.deactivatedAt).toBeTruthy();
  });
});
