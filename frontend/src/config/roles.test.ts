import { describe, it, expect } from 'vitest';
import { ROLE_HOME, ROLE_LABEL, ROLE_NAV } from './roles';

/**
 * These guard SRS invariants that are easy to regress by editing the nav:
 *  - no application role (incl. sys_admin) gets an Audit Logs view (BR-14, NFR-AUD-03)
 *  - the sys_admin sees account management only — no clinical/analytics views (FR-061)
 *  - the analyst nav is read-only (no data entry / registration)
 */
describe('role configuration invariants', () => {
  it('maps every role to a home route and a label', () => {
    for (const role of ['sys_admin', 'practitioner', 'analyst'] as const) {
      expect(ROLE_HOME[role]).toBeTruthy();
      expect(ROLE_LABEL[role]).toBeTruthy();
      expect(ROLE_NAV[role].length).toBeGreaterThan(0);
    }
  });

  it('never exposes an audit-log view to any role', () => {
    for (const items of Object.values(ROLE_NAV)) {
      for (const item of items) {
        expect(`${item.label} ${item.to}`.toLowerCase()).not.toMatch(/audit/);
      }
    }
  });

  it('gives the sys_admin only account management (no clinical/analytics)', () => {
    const paths = ROLE_NAV.sys_admin.map((i) => i.to);
    expect(paths).toEqual(['/admin/accounts']);
    for (const i of ROLE_NAV.sys_admin) {
      expect(`${i.label} ${i.to}`.toLowerCase()).not.toMatch(/patient|analytics|record|disease/);
    }
  });

  it('keeps the analyst nav read-only (no registration or data entry)', () => {
    for (const i of ROLE_NAV.analyst) {
      expect(`${i.label} ${i.to}`.toLowerCase()).not.toMatch(/register|data-entry|submit/);
    }
  });
});
