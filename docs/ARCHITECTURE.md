# AgencyOS - Architecture Blueprint

## 1. System Overview

AgencyOS is an agency management SaaS, CRM, and Sales Intelligence operating system. It provides two independent, visually distinct workspaces powered by a centralized TypeScript backend:

1. **Super Admin Workspace (`/admin`)**: Company financial management, executive KPI aggregation, client directory, development projects, recurring retainers engine, payments verification ledger, expense tracking, team permission management, and audit trail.
2. **Sales Workspace (`/sales`)**: Dedicated sales operations, personal lead pipeline (Kanban), restricted cross-company client directory, call logging, scheduled follow-ups, quota pacing, and sales enablement playbooks.

---

## 2. Monorepo Structure

```text
agencyos/
├── apps/
│   ├── api/                  # Express + Node.js + TypeScript + Mongoose backend
│   │   ├── src/
│   │   │   ├── config/       # Environment & MongoDB Atlas connection
│   │   │   ├── middleware/   # JWT authentication, RBAC, Zod validation, Audit logging
│   │   │   ├── models/       # 24 Normalized Mongoose schemas with compound indexes
│   │   │   ├── modules/      # Feature modules (Auth, Clients, Leads, Projects, Retainers, Payments, Expenses, Finance, Calls, Followups, Knowledge, Content)
│   │   │   ├── scripts/      # Standalone database seed script
│   │   │   ├── sockets/      # Socket.IO authenticated org & user room handlers
│   │   │   ├── utils/        # AppError, ApiResponse, Logger
│   │   │   ├── app.ts        # Express application configuration
│   │   │   └── server.ts     # HTTP server bootstrap & Socket.IO initialization
│   │   └── test/             # Automated test suite (Vitest)
│   └── web/                  # Vite + React + TypeScript + Tailwind frontend
│       ├── src/
│       │   ├── components/   # ProtectedRoute, Modals, Badges
│       │   ├── layouts/      # AdminLayout (collapsible), SalesLayout, AuthLayout
│       │   ├── lib/          # Typed API client, Socket.IO client, Formatters
│       │   ├── pages/        # Admin, Sales, Auth, and Common detail views
│       │   ├── stores/       # Zustand persistent authentication store
│       │   └── App.tsx       # Route definitions with role-based access gates
├── packages/
│   └── shared/               # Universal domain types, constants, and Zod schemas
└── docs/                     # Engineering documentation
```

---

## 3. Core Architectural Decisions

### 3.1 Strict Cash Accounting vs. Revenue Recognition
- **Cleared Cash Inflow**: Only transactions marked as `Verified` are counted toward cash inflow.
- **Pending Receivables**: Contract balances and token commitments remain tracked under receivables without polluting bottom-line cash.
- **Recognized Expenses**: Only approved operational disbursements enter expense aggregations.
- **Net Profit & Margin**:
  $$\text{Net Profit} = \text{Verified Inflow} - \text{Recognized Expenses}$$
  $$\text{Profit Margin} = \begin{cases} \left(\frac{\text{Net Profit}}{\text{Verified Inflow}}\right) \times 100 & \text{if Verified Inflow} > 0 \\ 0 & \text{if Verified Inflow} \le 0 \end{cases}$$

### 3.2 Retainer Calendar Anchor Date Preservation
- Preserves the client's initial billing anchor date (e.g., 20th of every month) without cumulative date drift.
- Edge cases (such as 31st anchoring into February with 28 days) automatically snap to the last day of the month without overflowing into March.
- Historical periods are archived permanently into `historyPeriods` during renewals and never overwritten.

### 3.3 Record-Level RBAC & Data Sanitization
- Sales Members receive filtered client records where `totalContractAmount`, `remainingBalance`, `initialToken`, `advancePayment`, and internal notes are stripped at the backend controller level.
- Multi-tenant data isolation ensures queries are always scoped to `req.user.organizationId` derived from the verified JWT.
