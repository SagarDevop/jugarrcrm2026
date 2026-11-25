# AgencyOS - RBAC & Permissions Matrix

All permissions are strictly verified at the backend middleware level. Frontend permission checks solely adjust navigational presentation.

---

## Roles Overview

1. **Super Admin (`SUPER_ADMIN`)**: Unrestricted administrative and financial authority.
2. **Sales Member (`SALES_MEMBER`)**: Pipeline management, client directory with restricted financials, call tracking, follow-ups, and sales training resources.
3. **Project Manager (`PROJECT_MANAGER`)**: Future-ready operational delivery role.
4. **Client Manager (`CLIENT_MANAGER`)**: Future-ready account management role.

---

## Granular Permissions Mapping

| Permission Key | Super Admin | Sales Member (Default) | Notes |
|----------------|:-----------:|:----------------------:|-------|
| `clients.view_all` | Yes | Yes (Sanitized) | Sales views limited fields; financials stripped |
| `clients.create` | Yes | Yes | Can onboard converted clients |
| `clients.update` | Yes | No | Managed by Super Admin |
| `leads.view_all` | Yes | No | Sales views assigned leads only |
| `leads.create` | Yes | Yes | Open to sales team |
| `leads.update_assigned`| Yes | Yes | Updates stage, notes, next follow-up |
| `calls.view` | Yes | Yes | View interaction history |
| `calls.create` | Yes | Yes | Log call records |
| `followups.view` | Yes | Yes | View upcoming touchpoints |
| `followups.create` | Yes | Yes | Schedule reminders |
| `projects.view` | Yes | Yes | Operational progress view |
| `projects.create` | Yes | No | Admin-only project setup |
| `retainers.view` | Yes | No | Admin-only retainer management |
| `retainers.manage` | Yes | No | Renewal & deliverables configuration |
| `payments.view` | Yes | No | Unlocked only if explicit finance permission granted |
| `payments.create` | Yes | Yes | Sales can submit pending payment records |
| `payments.verify` | Yes | No | Only Super Admin can verify into cleared inflow |
| `expenses.view` | Yes | No | Strictly hidden from sales by default |
| `expenses.create` | Yes | No | Operational disbursement logging |
| `finance.view_revenue` | Yes | No | Revenue visibility permission |
| `finance.view_expenses`| Yes | No | Expense visibility permission |
| `finance.view_profit` | Yes | No | Profit/margin visibility permission |
| `finance.view_reports` | Yes | No | Executive reporting permission |
| `team.manage` | Yes | No | Admin creates, resets passwords, and assigns quotas |
| `knowledge.view` | Yes | Yes | Sales pitches, playbooks, SOPs |
| `knowledge.manage` | Yes | No | Admin publishes and archives |
| `content.manage` | Yes | No | Admin content library and AI generator |
| `audit.view` | Yes | No | Administrative security logs |
