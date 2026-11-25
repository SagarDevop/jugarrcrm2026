# AgencyOS - API Documentation

Base URL: `/api`  
Authentication: Bearer JWT token in `Authorization` header or HTTP-only `accessToken` cookie.

---

## Authentication Endpoints

### `POST /api/auth/register`
Creates an agency organization and its initial Super Admin account.

### `POST /api/auth/login`
Validates credentials, sets HTTP-only secure cookies (`accessToken`, `refreshToken`), and returns user payload.

### `POST /api/auth/refresh`
Rotates tokens using the HTTP-only refresh cookie.

### `POST /api/auth/logout`
Clears session cookies and logs security audit event.

### `GET /api/auth/me`
Retrieves authenticated user profile and organization details.

---

## Core Operations Endpoints

### Clients
- `GET /api/clients`: List clients (filtered and sanitized based on user role).
- `POST /api/clients`: Register client (includes duplicate phone/email detection).
- `GET /api/clients/:id`: Fetch client profile with projects, retainers, and communication history.
- `PUT /api/clients/:id`: Update client record.

### Leads
- `GET /api/leads`: List pipeline leads (role-restricted: sales sees assigned/created).
- `POST /api/leads`: Add new lead with duplicate check.
- `GET /api/leads/:id`: View lead details and activity timeline.
- `PUT /api/leads/:id`: Advance lead stage.
- `POST /api/leads/:id/convert`: Convert lead to active client.

### Projects & Retainers
- `GET /api/projects`: List development projects.
- `POST /api/projects`: Create project with quotation breakdown & milestones.
- `PUT /api/projects/:id/milestones/:milestoneId`: Update milestone status.
- `GET /api/retainers`: List recurring retainers.
- `POST /api/retainers`: Create retainer with calendar anchor date.
- `POST /api/retainers/:id/renew`: Archive completed period and renew without date drift.

### Finance & Payments
- `GET /api/payments`: Centralized payments ledger.
- `POST /api/payments`: Record incoming payment (starts as `Pending`).
- `POST /api/payments/:id/verify`: Verify payment (clears cash inflow, calculates commission).
- `GET /api/expenses`: List operational expenses.
- `POST /api/expenses`: Record operational expense.
- `GET /api/finance/overview`: Aggregated executive KPIs, profit margins, and monthly trends.

### Sales Operations
- `GET /api/sales/dashboard`: Personal sales quota, attributed revenue, conversion rate.
- `GET /api/calls`: Interaction logs.
- `POST /api/calls`: Record call outcome.
- `GET /api/followups`: Scheduled touchpoints.
- `POST /api/followups`: Create follow-up.
- `GET /api/commissions`: Verified commission payouts.
