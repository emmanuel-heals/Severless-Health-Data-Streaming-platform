/*
 * Role → home route and permitted navigation (UI-02, FR-061/062/063/064).
 * The nav lists ONLY the signed-in role's views. The sys_admin nav deliberately has
 * no Audit Logs or Settings entry: no application role may read audit logs (BR-14,
 * NFR-AUD-03), and the admin sees no clinical/analytics data (FR-061).
 */
import type { Role } from '@/types/domain';

export interface NavItem {
  label: string;
  to: string;
  /** icon key resolved by the Icon component */
  icon: string;
  end?: boolean;
}

export const ROLE_HOME: Record<Role, string> = {
  sys_admin: '/admin/accounts',
  practitioner: '/practitioner',
  analyst: '/analyst',
};

export const ROLE_LABEL: Record<Role, string> = {
  sys_admin: 'System Administrator',
  practitioner: 'Health Practitioner',
  analyst: 'Health Analyst',
};

export const ROLE_NAV: Record<Role, NavItem[]> = {
  sys_admin: [
    { label: 'Account Management', to: '/admin/accounts', icon: 'users', end: true },
  ],
  practitioner: [
    { label: 'Dashboard', to: '/practitioner', icon: 'home', end: true },
    { label: 'My Patients', to: '/practitioner/patients', icon: 'patients' },
    { label: 'Register Patient', to: '/practitioner/patients/register', icon: 'user-plus' },
    { label: 'Submit Data', to: '/practitioner/data-entry', icon: 'activity' },
  ],
  analyst: [
    { label: 'Dashboard', to: '/analyst', icon: 'home', end: true },
    { label: 'Disease Analytics', to: '/analyst/analytics', icon: 'chart' },
  ],
};
