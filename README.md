# Bloc Admin UI

Bloc Admin UI is a React, TypeScript and Vite frontend for managing apartment buildings, residents, apartments, utilities and administration workflows.

The application is built around role-based experiences for platform administrators, association administrators, censors and residents. It combines backend-connected management screens with mocked workflow data while the remaining modules are developed.

---

## Features

### Platform administration
- Super admin dashboard
- Administrator account management
- Global block and resident oversight
- Water consumption monitoring
- Data export workspace

### Building administration
- Dashboard overview with operational metrics
- Block, staircase and apartment management
- Resident management
- Finance workspace for invoices, expenses, payments and resident bills
- Water consumption tracking and resident index submissions
- Reports workspace
- Application settings

### Resident experience
- Personal dashboard
- Bills and payment overview
- Water index submission
- Personal settings

### Shared experience
- Role-based navigation and route protection
- Mock login/session flow backed by available database accounts
- Responsive sidebar and topbar layout
- Dark and light theme switching
- Multi-language support with i18next
- Notifications drawer and notification API integration
- Reusable data views, filters, dialogs and status components
- Type-safe domain models and API services

---

## Tech Stack

- React 19
- TypeScript
- Vite
- Material UI
- React Router
- i18next / react-i18next
- Day.js
- Vite PWA
- ESLint

---

## Project Structure

```bash
src/
├── app/                 # Routing and protected routes
├── application/         # Application-level access helpers
├── areas/               # Feature areas for block admin and support platform
├── components/          # Shared UI, layout and notification components
├── contexts/            # Role and session context
├── domain/              # Domain presentation helpers
├── hooks/               # Reusable data hooks
├── i18n/                # Localization setup and locale files
├── layouts/             # App shell layout
├── mocks/               # Mock accounts and workflow data
├── pages/               # Standalone pages such as login
├── services/            # API clients and backend integrations
├── theme/               # MUI theme configuration
├── types/               # Shared TypeScript types
└── utils/               # Formatting, pagination and domain utilities
```

---

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run a production build:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

Preview the production build:

```bash
npm run preview
```

---

## Backend Connection Status

This UI repository depends on the separate API repository for backend services and data persistence. To use backend-connected features, set up and run the API project alongside this frontend and configure the frontend to connect to it.

The frontend currently includes API services for:

- Blocks
- Staircases
- Apartments
- Apartment residents
- Residents
- User accounts / mock login
- Water readings
- Notifications
- Super admin views

Some finance, reporting and administration workflows still use local mock data while their backend endpoints are completed.

---

## Current Status

### Implemented

- Responsive application shell
- Sidebar and topbar navigation
- Role-based menus and protected routes
- Theme switching
- Translation system
- Mock login/session handling
- Backend-connected management foundations
- Super admin area
- Block admin area
- Resident and censor-specific views
- Water consumption foundations
- Notifications UI

### Planned

- Production authentication flow
- Online payments
- Full invoice lifecycle
- Bill export
- Expanded notification workflows
- Additional backend-connected finance and reporting modules

---

## Author

Developed as a modern apartment administration platform focused on usability, scalability and clean UI.
