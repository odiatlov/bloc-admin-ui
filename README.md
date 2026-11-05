# Bloc Admin UI

Bloc Admin UI is a React, TypeScript and Vite frontend for managing apartment buildings, apartments, people, utilities and monthly maintenance billing.

The application provides dedicated workspaces for platform administrators, association administrators, censors and residents. It combines backend-connected workflows with demo data in selected views.

---

## ✨ Features

### 🛠️ Platform administration

- Super admin dashboard
- Administrator accounts, invitations and block assignments
- Filterable Users directory with account status, block roles and linked person records
- Account deletion with an impact preview, email confirmation and operation status
- Global Blocks and Persons views with creation on behalf of an association administrator
- Apartment overviews with staircase and floor filters and setup status
- Water consumption monitoring with apartment meter history and index charts
- Demo data export workspace with CSV and JSON downloads

### 🏢 Building administration

- Dashboard overview with operational metrics
- Block, staircase and apartment management with a guided setup wizard for adding floors, generating apartments in batches and reviewing the layout
- Apartment configuration with surface area, occupancy, boiler and water meter settings
- Persons directory for managing people, apartment assignments and account invitations
- Owner assignment during setup with new or existing person records, invitation email validation and separate counts for owners and occupants
- Monthly water consumption by block and period, with reading entry, household counts and reminders for missing readings
- Block settings for water submission schedules, censor assignments, charges, allocation rules, supply groups and apartment heating
- Monthly finance workspace with expenses, main water meter readings, adjustments and readiness checks for generating maintenance reports
- Reports workspace with water consumption summaries, saved maintenance report revisions and detailed charge breakdowns
- Maintenance list and detailed Excel exports, censor review submission and resubmission, and publication with due dates and arrears decisions

### 📋 Censor experience

- Block-scoped access for resident or external censors assigned in block settings
- Dashboard with review shortcuts and read-only consumption and reporting summaries for assigned blocks
- Review queue with submission details, status, revision history and Excel export
- Approval and rejection of submitted reports, with a required reason for rejection

### 🏠 Resident experience

- Personal dashboard with the current amount due, assigned apartments and recent water consumption
- My Bills with published maintenance bills and saved charge and adjustment breakdowns
- Hot and cold water index submission for eligible apartments and reading periods
- Meters view with active and inactive apartment meters, date filters, reading history and index charts
- Personal settings with profile editing

### 🌍 Shared experience

- Role-based navigation and route protection
- Mock login/session flow backed by available database accounts
- Responsive sidebar, topbar, tables and mobile cards
- Dark and light themes with matching native controls and scrollbars
- English and Romanian localization with i18next
- Notifications drawer with unread counts, water reading reminders and links to financial reviews and reports
- Filters and pagination that are remembered per account and role within the browser tab
- Reusable dialogs, loading and error states, and status components
- Type-safe domain models and API services

---

## 🧰 Tech Stack

- React 19
- TypeScript
- Vite
- Material UI
- React Router
- i18next / react-i18next
- Day.js
- Vite PWA
- ESLint
- Vitest, React Testing Library and jsdom

---

## 📂 Project Structure

```bash
src/
├── app/                 # Routing and protected routes
├── application/         # Application-level access helpers
├── areas/               # Feature areas for block admin and support platform
├── assets/              # Static assets
├── components/          # Shared UI, setup, meter history and notifications
├── contexts/            # Role and session context
├── domain/              # Domain presentation helpers
├── hooks/               # Reusable data and page state hooks
├── i18n/                # Localization setup and locale files
├── layouts/             # App shell layout
├── mocks/               # Demo accounts and role permissions
├── pages/               # Standalone pages such as login
├── services/            # API clients and backend integrations
├── theme/               # MUI theme configuration
├── types/               # Shared TypeScript types
└── utils/               # Formatting, pagination and domain utilities
```

Tests live alongside source files in `src/`. Shared test setup, render helpers and fixtures live in `tests/`.

---

## 🚀 Getting Started

Use Node.js 24 with npm. Install dependencies with the following command.

```bash
npm install
```

Start the development server.

```bash
npm run dev
```

Run a production build.

```bash
npm run build
```

Run linting.

```bash
npm run lint
```

Run tests in watch mode.

```bash
npm test
```

Run the full test suite once.

```bash
npm run test:run
```

Preview the production build.

```bash
npm run preview
```

---

## 🔌 Backend Connection Status

Run the separate `bloc-admin-api` project alongside the frontend to use backend-connected features. The Vite development server proxies `/api` to `http://localhost:5153`. Set `VITE_API_BASE_URL` when using a different API base URL.

The frontend uses the API for the following workflows.

- Blocks, staircases, apartments and block setup
- Persons, apartment assignments, profile updates and invitations
- User accounts, mock login and platform administration
- Water reading settings, consumption, submissions and meter history
- Finance configuration, monthly inputs, report generation, Excel exports and publication
- Censor assignments, review submissions, decisions and review history
- Resident balances, published bills and bill details
- Notifications and unread counts

Platform account deletion uses a trusted API session. In local development, the API can exchange the selected super admin mock login for a development session.

The platform data export workspace, resident dashboard announcements and some demo account views still use local fixtures.

---

## 📌 Current Status

### Implemented

- Responsive role-based application shell with theme switching, localization and mock login
- Backend-connected property setup, people and account management
- Monthly water readings and meter history for platform staff and residents
- Maintenance reporting from monthly finance inputs through censor review and publication
- Published resident bills and current balances
- Unit and component tests for route access, setup, finance, water readings and shared UI

### Planned

- Production authentication flow
- Online payments
- Full invoice lifecycle
- Resident bill downloads
- Expanded notification workflows
- Backend-connected platform data exports

---

## 👨‍💻 Author

Developed as a modern apartment administration platform focused on usability, scalability and clean UI.
