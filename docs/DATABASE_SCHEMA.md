# AgencyOS - Database Schema Specification

AgencyOS uses normalized-by-reference MongoDB collections with compound indexing and strict organization isolation.

---

## Collections Overview

| Collection | Description | Primary Indexes |
|------------|-------------|-----------------|
| `organizations` | Multi-tenant organization profile and settings | `slug` (unique) |
| `users` | Accounts, passwords, roles, permissions | `{ organizationId: 1, email: 1 }` (unique) |
| `clients` | Client accounts, contracts, balances | `{ organizationId: 1, phone: 1 }`, `{ organizationId: 1, email: 1 }` |
| `leads` | Sales pipeline leads | `{ organizationId: 1, status: 1 }`, `{ organizationId: 1, assignedTo: 1 }` |
| `projects` | Web development projects & milestones | `{ organizationId: 1, clientId: 1 }`, `{ organizationId: 1, status: 1 }` |
| `retainers` | Social media recurring retainers | `{ organizationId: 1, clientId: 1 }`, `{ organizationId: 1, status: 1 }` |
| `payments` | Centralized financial ledger | `{ organizationId: 1, status: 1 }`, `{ organizationId: 1, paymentDate: 1 }` |
| `expenses` | Company operational expenditures | `{ organizationId: 1, date: 1 }`, `{ organizationId: 1, category: 1 }` |
| `calls` | Client & prospect call interactions | `{ organizationId: 1, callDate: 1 }`, `{ organizationId: 1, recordedBy: 1 }` |
| `followups` | Scheduled touchpoints and reminders | `{ organizationId: 1, assignedTo: 1, status: 1 }` |
| `commissions` | Deal incentives on verified payments | `paymentId` (unique to prevent duplicate calculations) |
| `knowledgeResources` | Published playbooks, pitch scripts | Text index on `{ title, description, searchTags }` |
| `contentItems` | Content repository & AI drafts | `{ organizationId: 1, category: 1 }` |
| `notifications` | In-app alerts | `{ organizationId: 1, recipientId: 1, read: 1 }` |
| `auditLogs` | Security & financial audit trail | `{ organizationId: 1, createdAt: -1 }` |
| `activityEvents` | Timeline events for leads & clients | `{ organizationId: 1, entityId: 1, createdAt: -1 }` |
| `settings` | Agency-level configurations | `{ organizationId: 1 }` (unique) |
