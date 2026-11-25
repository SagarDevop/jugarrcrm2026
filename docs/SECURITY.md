# AgencyOS - Security & Data Protection Architecture

## 1. Authentication & Session Management
- **Password Security**: Passwords are encrypted using `bcryptjs` with high salt work factors. Plaintext passwords are never logged or stored.
- **Dual Token Architecture**:
  - Short-lived Access Token (15 minutes).
  - Rotating Refresh Token (7 days) stored inside HTTP-only, SameSite secure cookies.
- **Session Revocation**: Logging out clears both cookies and logs the event to the immutable audit trail.
- **Admin Password Reset**: Super Admins can reset member passwords securely without requiring knowledge of old passwords.

---

## 2. Multi-Tenant Data Isolation
- Every database query strictly incorporates `organizationId`.
- The application never trusts client-supplied tenant identifiers; `req.user.organizationId` is always extracted from the cryptographically verified JWT payload.
- Real-time Socket.IO rooms are scoped to `org:${organizationId}` and `user:${userId}`. Sensitive financial updates are never broadcast to sales-only rooms.

---

## 3. Defense-in-Depth Protections
- **Helmet**: Secures HTTP response headers.
- **CORS**: Explicit whitelist limited to authorized client origins.
- **Input Validation**: Strict Zod schemas validate and sanitize all payloads prior to hitting controller logic.
- **NoSQL Injection Guard**: Parameterized Mongoose queries prevent arbitrary operator injection.
