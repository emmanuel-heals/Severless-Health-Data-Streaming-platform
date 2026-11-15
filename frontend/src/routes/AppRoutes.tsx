import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from '@/auth/RequireAuth';
import { RequireRole } from '@/auth/RequireRole';
import { AppShell } from '@/components/layout/AppShell';
import { Login } from '@/pages/Login';
import { ChangePassword } from '@/pages/ChangePassword';
import { AccountManagement } from '@/pages/admin/AccountManagement';
import { PractitionerDashboard } from '@/pages/practitioner/PractitionerDashboard';
import { RegisterPatient } from '@/pages/practitioner/RegisterPatient';
import { HealthDataEntry } from '@/pages/practitioner/HealthDataEntry';
import { PatientRecords } from '@/pages/practitioner/PatientRecords';
import { AnalystDashboard } from '@/pages/analyst/AnalystDashboard';
import { DiseaseAnalytics } from '@/pages/analyst/DiseaseAnalytics';

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
        <Route
          path="/admin/accounts"
          element={
            <RequireRole role="sys_admin">
              <AccountManagement />
            </RequireRole>
          }
        />

        {/* practitioner */}
        <Route
          path="/practitioner"
          element={
            <RequireRole role="practitioner">
              <PractitionerDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/practitioner/patients"
          element={
            <RequireRole role="practitioner">
              <PatientRecords />
            </RequireRole>
          }
        />
        <Route
          path="/practitioner/patients/register"
          element={
            <RequireRole role="practitioner">
              <RegisterPatient />
            </RequireRole>
          }
        />
        <Route
          path="/practitioner/patients/:patientId"
          element={
            <RequireRole role="practitioner">
              <PatientRecords />
            </RequireRole>
          }
        />
        <Route
          path="/practitioner/data-entry"
          element={
            <RequireRole role="practitioner">
              <HealthDataEntry />
            </RequireRole>
          }
        />

        {/* analyst */}
        <Route
          path="/analyst"
          element={
            <RequireRole role="analyst">
              <AnalystDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/analyst/analytics"
          element={
            <RequireRole role="analyst">
              <DiseaseAnalytics />
            </RequireRole>
          }
        />
      </Route>

      {/* Anything else → login (which forwards to the role home if already signed in) */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
