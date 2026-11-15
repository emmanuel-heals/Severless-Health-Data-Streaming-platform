# Health Streaming Platform — Frontend (React SPA)

React + TypeScript + Vite SPA for the Health Streaming Platform. Built to the
*Frontend Implementation Plan.md* in the repository root, which is derived from the SRS v1.0.

## Quick start

```bash
cd frontend
npm install
cp .env.example .env   # defaults use mock auth; no Cognito pool required
npm run dev            # http://localhost:5173
```

### Mock sign-in (local dev)
`VITE_AUTH_MODE=mock` enables three demo accounts so every role can be exercised without Cognito:

| Role | Username | Password | Lands on |
|------|----------|----------|----------|
| System Administrator | `admin` | `admin` | `/admin/accounts` |
| Health Practitioner | `doctor` | `doctor` | `/practitioner` |
| Health Analyst | `analyst` | `analyst` | `/analyst` |

The login screen also shows quick-fill buttons in mock mode. These are **development only** and never appear under real Cognito (`VITE_AUTH_MODE=cognito`).

## Scripts
- `npm run dev` — dev server
- `npm run build` — typecheck (`tsc -b`) + production build to `dist/`
- `npm run preview` — serve the production build
- `npm run typecheck` — types only

## What is implemented (Phase 0–1)
- **Foundation:** Vite + TS, design tokens for the mandated palette (§4.1), responsive app shell (sidebar + top bar), shared UI kit (Button, Card, StatCard, PageHeader, Icon).
- **Auth & RBAC:** login (generic error per FR-009), forced first-login password change (FR-010), in-memory session, role-guarded routing (`RequireAuth`, `RequireRole`) that redirects cross-role access to the user's own dashboard (FR-064). Nav shows only the signed-in role's views (UI-02); the admin nav intentionally has **no audit-log view** (BR-14 / NFR-AUD-03).
- **API layer:** Axios instance with JWT injection (CI-02) and central 401/403 handling.
- **View stubs:** all eight SRS views are routed; dashboards render their stat layout, data sections are marked for Phases 2–4.

## Auth modes
- `mock` — local, no backend. Session held in `sessionStorage` for reloads.
- `cognito` — wire up a real user pool. Replace `CognitoAuthServiceNotConfigured` in
  `src/services/authService.ts` with an Amplify/`amazon-cognito-identity-js` implementation of the
  `AuthService` interface. No other file imports the auth SDK.

## Structure
See `src/` — `pages/` (views), `components/` (shared UI + layout), `auth/` (context + guards),
`services/` (auth + API), `config/` (env, roles, field schemas), `theme/` (tokens + globals),
`types/` (domain models).

## Next phases
- **Phase 2** — sys_admin Account Management (create/deactivate, `/accounts`).
- **Phase 3** — Practitioner flows (register patient, data entry + submission/idempotency, records).
- **Phase 4** — Analyst flows (categories, incoming feed, Plotly analytics).
- **Phase 5** — responsive/a11y hardening, E2E + axe in CI.
