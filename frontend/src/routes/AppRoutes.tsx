import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from '@/auth/RequireAuth';
import { RequireRole } from '@/auth/RequireRole';
import { AppShell } from '@/components/layout/AppShell';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { Login } from '@/pages/Login';
import { ChangePassword } from '@/pages/ChangePassword';

/*
 * Authenticated pages are code-split per role (React.lazy): a practitioner never downloads the
 * analyst bundle (which carries Plotly), and vice-versa. Login/ChangePassword stay eager so the
 * very first paint needs no extra round-trip. (NFR-PERF; §17 Phase 5.)
 */
const AccountManagement = lazy(() => import('@/pages/admin/AccountManagement').then((m) => ({ default: m.AccountManagement })));
const PractitionerDashboard = lazy(() => import('@/pages/practitioner/PractitionerDashboard').then((m) => ({ default: m.PractitionerDashboard })));
const RegisterPatient = lazy(() => import('@/pages/practitioner/RegisterPatient').then((m) => ({ default: m.RegisterPatient })));
const HealthDataEntry = lazy(() => import('@/pages/practitioner/HealthDataEntry').then((m) => ({ default: m.HealthDataEntry })));
const PatientRecords = lazy(() => import('@/pages/practitioner/PatientRecords').then((m) => ({ default: m.PatientRecords })));
const AnalystDashboard = lazy(() => import('@/pages/analyst/AnalystDashboard').then((m) => ({ default: m.AnalystDashboard })));
const DiseaseAnalytics = lazy(() => import('@/pages/analyst/DiseaseAnalytics').then((m) => ({ default: m.DiseaseAnalytics })));

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />

      {/* Authenticated area with the role-aware shell */}
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        {/* sys_admin */}
        <Route path="/admin/accounts" element={<Guarded role="sys_admin"><AccountManagement /></Guarded>} />

        {/* practitioner */}
        <Route path="/practitioner" element={<Guarded role="practitioner"><PractitionerDashboard /></Guarded>} />
        <Route path="/practitioner/patients" element={<Guarded role="practitioner"><PatientRecords /></Guarded>} />
        <Route path="/practitioner/patients/register" element={<Guarded role="practitioner"><RegisterPatient /></Guarded>} />
        <Route path="/practitioner/patients/:patientId" element={<Guarded role="practitioner"><PatientRecords /></Guarded>} />
        <Route path="/practitioner/data-entry" element={<Guarded role="practitioner"><HealthDataEntry /></Guarded>} />

        {/* analyst */}
        <Route path="/analyst" element={<Guarded role="analyst"><AnalystDashboard /></Guarded>} />
        <Route path="/analyst/analytics" element={<Guarded role="analyst"><DiseaseAnalytics /></Guarded>} />
      </Route>

      {/* Anything else → login (which forwards to the role home if already signed in) */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

/** Role gate + per-view error boundary + Suspense fallback for the lazy page bundle. */
function Guarded({ role, children }: { role: 'sys_admin' | 'practitioner' | 'analyst'; children: React.ReactNode }) {
  return (
    <RequireRole role={role}>
      <ErrorBoundary>
        <Suspense fallback={<FullPageLoader label="Loading…" />}>{children}</Suspense>
      </ErrorBoundary>
    </RequireRole>
  );
}
