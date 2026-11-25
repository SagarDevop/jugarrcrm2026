# AgencyOS - Agency Management SaaS + CRM + Sales Intelligence

AgencyOS is a high-performance operating system designed for modern digital agencies, software consultancies, and growth studios.

Built with a modular monorepo architecture featuring two independent workspaces:
- **Super Admin Workspace**: Complete executive command, verified financial ledger, web development project engine, social media recurring retainers engine, and sales team administration.
- **Sales Workspace**: High-momentum sales pipeline, shared client directory (with sensitive financials automatically sanitized), call tracking, follow-ups, and sales intelligence playbooks.

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide Icons, React Router 6, TanStack Query, Zustand, React Hook Form, Zod.
- **Backend**: Node.js, Express, TypeScript, MongoDB Atlas (Mongoose), JWT authentication, HTTP-only cookies, bcryptjs, Socket.IO, Helmet, Morgan.
- **Shared**: `@agencyos/shared` package with common domain models, constants, and Zod validators.
- **Testing**: Vitest automated unit and integration tests.

---

## Monorepo Architecture

```text
agencyos/
├── apps/
│   ├── api/                  # Express REST backend + Socket.IO server
│   └── web/                  # React + Vite desktop-first web application
├── packages/
│   └── shared/               # Domain models, types, constants & Zod schemas
└── docs/                     # Full technical documentation
```

---

## Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `MONGODB_URI` points to your MongoDB instance (local or MongoDB Atlas).

### 3. Seed Demo Data (Optional for Development)
```bash
npm run seed
```

#### Demo Credentials:
- **Super Admin**: `founder@agencyos.com` / `agencyos2026`
- **Sales Member**: `sarah.sales@agencyos.com` / `agencyos2026`
- **Sales Member 2**: `marcus.sales@agencyos.com` / `agencyos2026`
- **Sales Member 3**: `elena.sales@agencyos.com` / `agencyos2026`

### 4. Run Development Servers
```bash
# Run Backend API (Port 5000)
npm run dev:api

# Run Frontend Web (Port 5173)
npm run dev:web
```

### 5. Run Test Suite
```bash
npm test
```

### 6. Production Build
```bash
npm run build
```

---

## Key Features

1. **Dual Independent Workspaces**:
   - `/admin/*`: Super Admin workspace.
   - `/sales/*`: Sales team workspace.
2. **Granular RBAC & Field Sanitization**:
   - Record-level authorization. Sales users can view clients but sensitive profit margins, expenses, and internal notes are stripped at the API layer.
3. **Strict Cash Accounting**:
   - Verified cash inflow is strictly separated from pending receivables.
   - Net Profit = Verified Inflow - Recognized Expenses.
   - Safe margin calculation protects against zero-division errors.
4. **Social Media Retainer Engine**:
   - Anchor date preservation ensures no date drift across multi-period renewals.
   - Month-end edge cases (e.g. 31st into February) handled safely.
   - Historical periods archived and preserved.
5. **Web Development Project Engine**:
   - Custom quotation cost breakdown (Frontend, Backend, Hosting, Domain, Maintenance).
   - Milestone completion tracking and production asset repository.
6. **Real-Time Updates**:
   - Authenticated Socket.IO connections scoped to organization and user rooms.

---

## Documentation

Detailed architectural and operational documentation can be found in the `docs/` directory:
- [Architecture Blueprint](file:///c:/Users/Admin/OneDrive/Desktop/jugarrcrm/docs/ARCHITECTURE.md)
- [Database Schema Specification](file:///c:/Users/Admin/OneDrive/Desktop/jugarrcrm/docs/DATABASE_SCHEMA.md)
- [RBAC & Permissions Matrix](file:///c:/Users/Admin/OneDrive/Desktop/jugarrcrm/docs/RBAC_MATRIX.md)
- [API Documentation](file:///c:/Users/Admin/OneDrive/Desktop/jugarrcrm/docs/API_DOCUMENTATION.md)
- [Security Architecture](file:///c:/Users/Admin/OneDrive/Desktop/jugarrcrm/docs/SECURITY.md)
- [Implementation Roadmap](file:///c:/Users/Admin/OneDrive/Desktop/jugarrcrm/docs/IMPLEMENTATION_ROADMAP.md)
