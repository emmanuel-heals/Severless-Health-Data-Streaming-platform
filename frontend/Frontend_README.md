# Health Streaming Platform — Frontend Guide

A practical guide for a developer who is new to this project: how to get the frontend running
locally, what the components are, and how to change a component or a dashboard safely.

> This is the **frontend only** (React SPA). There is no backend in this repository. During
> development the app runs against an in-memory **mock data layer**, so you can use every screen
> without AWS, Cognito, or any server.

---

## 1. Getting it running locally

### Prerequisites
- **Node.js 20 or newer** (built and tested on Node 22) and **npm 10+**.
  Check with:
  ```bash
  node --version
  npm --version
  ```

### Pull and set up
```bash
# 1. Clone the repository from GitHub
git clone <your-repo-url> health-streaming-platform
cd health-streaming-platform/frontend

# 2. Install dependencies
npm install

# 3. Create your local environment file from the template
#    (the defaults use mock auth + mock data — no backend needed)
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env

# 4. Start the dev server
npm run dev
```
Then open the URL it prints (default **http://localhost:5173**).

### Sign in (mock mode)
With `VITE_AUTH_MODE=mock` (the default) there are three demo accounts. The login screen also
shows quick-fill buttons for them.

| Role | Username | Password | Lands on |
|------|----------|----------|----------|
| System Administrator | `admin` | `admin` | Account Management |
| Health Practitioner (Doctor) | `doctor` | `doctor` | Practitioner Dashboard |
| Health Analyst | `analyst` | `analyst` | Analyst Dashboard |

### All commands
```bash
npm run dev         # start the local dev server (hot reload)
npm run build       # type-check (tsc) + production build into dist/
npm run preview     # serve the production build locally
npm run typecheck   # type-check only, no build
npm run lint        # ESLint (when configured)
npm run test        # unit + integration + accessibility (axe) tests — Vitest
```

### Switching to a real backend later
Everything talks to the backend through two swap points. Set `VITE_AUTH_MODE=cognito` and fill the
`VITE_COGNITO_*` and `VITE_API_BASE_URL` values in `.env`. Then:
- implement the real Cognito calls in `src/services/authService.ts` (the `AuthService` interface), and
- the data services (e.g. `src/services/accountsApi.ts`) already have an HTTP implementation that is
  selected automatically in `cognito` mode.

No screen or component imports AWS directly — only these service files do.

---

## 2. How the code is organised

```
frontend/
├─ index.html                 # single HTML entry
├─ .env / .env.example        # config (API URL, auth mode, feature flags) — NO secrets
├─ src/
│  ├─ main.tsx                # app bootstrap: loads global CSS, mounts <App/>
│  ├─ App.tsx                 # providers: React Query, Router, Auth, Toasts
│  │
│  ├─ theme/                  # design system
│  │  ├─ tokens.css           #   the fixed colour palette + spacing/typography as CSS variables
│  │  ├─ globals.css          #   reset, base typography, focus styles
│  │  └─ app.css              #   small helpers (spinner, code)
│  │
│  ├─ config/                 # configuration-as-data
│  │  ├─ env.ts               #   typed access to .env values
│  │  ├─ roles.ts             #   role → home route + which nav items each role sees
│  │  └─ fieldSchemas.ts      #   form field definitions for "TBC" fields (account, patient, …)
│  │
│  ├─ types/domain.ts         # TypeScript models (UserAccount, Patient, HealthRecord, …)
│  │
│  ├─ services/               # ALL backend/data access lives here
│  │  ├─ authService.ts       #   sign-in / password / sign-out (mock + Cognito placeholder)
│  │  ├─ apiClient.ts         #   Axios instance: attaches JWT, handles 401/403
│  │  └─ accountsApi.ts       #   account list/create/deactivate (mock + HTTP behind one interface)
│  │
│  ├─ auth/                   # authentication state + route protection
│  │  ├─ AuthContext.tsx      #   holds the signed-in user + role; sign-in/out actions
│  │  ├─ useAuth.ts           #   hook to read auth state
│  │  ├─ RequireAuth.tsx      #   gate: must be logged in
│  │  └─ RequireRole.tsx      #   gate: must hold a given role (else redirect to own dashboard)
│  │
│  ├─ routes/AppRoutes.tsx    # the route table: which URL renders which page, with which guard
│  │
│  ├─ hooks/                  # data hooks (React Query) e.g. useAccounts.ts
│  │
│  ├─ components/             # reusable UI (not tied to one page)
│  │  ├─ Icon.tsx             #   inline SVG icon set
│  │  ├─ Brand.tsx            #   logo lockup
│  │  ├─ layout/AppShell.tsx  #   the signed-in frame: side nav + top bar + content area
│  │  ├─ ui/                  #   Button, Card, StatCard, Modal, ConfirmDialog, StatusBadge, …
│  │  ├─ forms/               #   Field, TextInput, SelectInput (labelled inputs w/ error text)
│  │  ├─ data/DataTable.tsx   #   responsive table (becomes stacked cards on mobile)
│  │  └─ feedback/            #   ToastProvider, EmptyState, FullPageLoader
│  │
│  └─ pages/                  # one folder per area; each file is a full screen
│     ├─ Login.tsx, ChangePassword.tsx
│     ├─ admin/               #   AccountManagement.tsx, CreateAccountForm.tsx
│     ├─ practitioner/        #   dashboard, register patient, data entry, patient records
│     └─ analyst/             #   dashboard, disease analytics
```

### The design system (read this before touching styles)
The visual identity is a **fixed five-colour palette** defined once in `src/theme/tokens.css`:

| Token | Colour | Use |
|-------|--------|-----|
| `--color-primary` | `#1f7a6e` teal | nav bar, primary buttons, active states, chart main series |
| `--color-background` | `#f2f7f6` | page background |
| `--color-highlight` | `#fcf58d` yellow | highlights/notices/selected rows (sparingly) |
| `--color-surface` | `#ffffff` | cards, forms, tables |
| `--color-text` | `#000000` | body text |

**Rules:** always style using these CSS variables, never raw hex. Yellow (`--color-highlight`) must
always carry **black** text. Each component uses a CSS Module (`*.module.css`) next to it.

### Reusable components at a glance
| Component | File | What it does |
|-----------|------|--------------|
| `Button` / `LinkButton` | `components/ui/Button.tsx` | buttons in variants: `primary`, `secondary`, `highlight`, `danger`, `ghost` |
| `Card` / `PageHeader` | `components/ui/Card.tsx` | white panel; page title + subtitle |
| `StatCard` / `StatGrid` | `components/ui/StatCard.tsx` | the icon + number + label tiles on dashboards |
| `Modal` | `components/ui/Modal.tsx` | accessible dialog (focus-trapped, ESC to close) |
| `ConfirmDialog` | `components/ui/ConfirmDialog.tsx` | confirm destructive actions |
| `StatusBadge` | `components/ui/StatusBadge.tsx` | Active / Deactivated / processing pills |
| `DataTable` | `components/data/DataTable.tsx` | column-driven table; stacks into cards on mobile |
| `Field` / `TextInput` / `SelectInput` | `components/forms/FormField.tsx` | labelled inputs with inline error text |
| `ToastProvider` + `useToast()` | `components/feedback/ToastProvider.tsx` | success/error notifications |
| `EmptyState` | `components/feedback/EmptyState.tsx` | friendly "nothing here yet" blocks |
| `AppShell` | `components/layout/AppShell.tsx` | the whole signed-in layout frame |
| `TrendChart` / `CategoryBarChart` | `components/charts/Chart.tsx` | themed Plotly charts, **lazy-loaded** (Plotly is code-split so it never bloats the initial bundle) |
| `IncomingFeed` | `components/analytics/IncomingFeed.tsx` | live, polling incoming-records feed (de-identified) |

---

## 3. How to change things

### Change a shared component (e.g. the Button)
1. Open the component in `src/components/ui/` and its `*.module.css`.
2. Edit the markup in the `.tsx`; edit styles in the `.module.css` using palette **tokens**.
3. Because it is reused, check every place it appears still looks right (search the component name).
4. `npm run build` to confirm types still pass.

### Change a dashboard or page
Each screen is one file under `src/pages/`. For example, to edit the Practitioner dashboard, open
`src/pages/practitioner/PractitionerDashboard.tsx`. Compose it from the shared components above
(`PageHeader`, `StatGrid` + `StatCard`, `Card`, `DataTable`, …). Keep all data access in a hook or a
service — pages should not call `fetch`/Axios directly.

### Add a new page/screen
1. Create `src/pages/<area>/MyScreen.tsx`.
2. Register its URL in `src/routes/AppRoutes.tsx`, wrapped in the right guard
   (`<RequireRole role="practitioner">…`).
3. If it should appear in the side nav, add an entry to that role in `src/config/roles.ts`.

### Add a navigation item
Edit `ROLE_NAV` in `src/config/roles.ts` — add `{ label, to, icon }` under the correct role. The nav
only ever shows the signed-in role's items, so this also controls visibility.

### Add or change form fields on a "TBC" form (account/patient/measurements)
These fields are intentionally **data, not code**, because the SRS leaves them "To Be Confirmed".
Edit `src/config/fieldSchemas.ts` (e.g. `accountCreateFields`) to add/remove a field; the form reads
from there. Validation lives alongside the form (Zod schema in `CreateAccountForm.tsx`).

### Change what talks to the "backend"
Edit the relevant file in `src/services/`. Each service exposes an interface with two
implementations — a **mock** (used now) and an **HTTP** one (used when `VITE_AUTH_MODE=cognito`). To
change demo data, edit the `seed` array in `src/services/accountsApi.ts`. To change endpoints, edit
the HTTP implementation in the same file. Nothing else needs to change.

### Change colours, spacing or fonts
Edit the variables in `src/theme/tokens.css`. The palette is fixed by the project spec, so normally
you would only adjust spacing/typography tokens — not the five brand colours.

### Tests & CI
Tests use **Vitest + Testing Library + axe-core** (accessibility). The harness lives in `src/test/`
(`renderWithProviders`, `seedMockSession`, `expectNoA11yViolations`). Test files sit next to the code
they cover as `*.test.ts(x)` and run against the mock data layer — no backend needed.
```bash
npm test            # run everything once
npm run typecheck   # types only
```
GitHub Actions (`.github/workflows/ci.yml`, at the repo root) runs **type-check → tests → build** on
every push and PR.

### Before you commit
```bash
npm run build     # must pass (type-check + production build)
npm test          # must pass (unit + integration + axe)
```

---

## 4. Where the detail lives
The full plan, the mapping of every screen to its requirements, and the delivery roadmap are in
**`../Frontend Implementation Plan.md`** (repository root). Start there if you need the "why" behind a
screen or a rule (for example, why the admin has no "Audit Logs" page).
