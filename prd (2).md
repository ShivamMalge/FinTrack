# Product Requirements Document (PRD)
## Personal Finance Tracker

### 1. Overview
A web application that allows users to track income, expenses, and savings. Admins manage global expense categories; users manage their own financial records (transactions) scoped strictly to themselves.

### 2. Goals
- Provide a simple, secure way for users to log and categorize financial transactions.
- Give admins control over the category taxonomy used across the platform.
- Enforce strict role-based access control (RBAC) so users can never see or modify another user's data.
- Ship a clean, dockerized, full-stack reference implementation suitable for evaluation.

### 3. Non-Goals (Out of Scope for v1)
- Bank/UPI integration or automatic transaction import.
- Multi-currency support.
- Budgeting/forecasting features.
- Mobile app (web-responsive only).
- Password reset via email (can be stubbed/mocked).

### 4. User Roles

| Role  | Description |
|-------|-------------|
| Admin | Manages expense/income categories. Can view all users (read-only) for oversight. Cannot create transactions on behalf of users. |
| User  | Manages their own transactions (create/read/update/delete). Can only read categories, not modify them. |

### 5. Functional Requirements

#### 5.1 Authentication
- FR-1: Users can register with email + password (bcrypt-hashed).
- FR-2: Users can log in and receive a JWT (short-lived access token; optional refresh token).
- FR-3: All protected routes require a valid JWT.
- FR-4: JWT payload includes `userId` and `role`.

#### 5.2 Category Management (Admin only)
- FR-5: Admin can create a category (name, type: income/expense, optional icon/color).
- FR-6: Admin can update or delete a category.
- FR-7: Any authenticated user can list all categories (read-only).
- FR-8: Deleting a category in use should be blocked or soft-deleted (decide + document behavior).

#### 5.3 Transaction Management (User)
- FR-9: User can create a transaction: amount, type (income/expense), category, date, note.
- FR-10: User can list only their own transactions, with pagination and filters (date range, category, type).
- FR-11: User can update or delete only their own transactions.
- FR-12: User cannot access another user's transactions under any circumstance, including via direct ID guessing (IDOR protection).

#### 5.4 Dashboard / Summary
- FR-13: User can view a summary: total income, total expense, net savings (for a selected period).
- FR-14: Optional: breakdown by category (for charts).

#### 5.5 Admin Oversight (optional stretch)
- FR-15: Admin can view aggregate stats (e.g., total users, total transactions) without accessing individual transaction details.

### 5.6 Extra Features (Polish / "Impress" Layer)
These are not core to grading correctness but demonstrate product sense and attention to detail. Build only after 5.1–5.4 are solid — see `phases.md` for sequencing.

- FR-16: **Dark/Light mode** — theme toggle, persisted (cookie or localStorage), respects system preference on first load.
- FR-17: **CSV Export** — user can export their own transactions (filtered by current date range/category) as a `.csv` file.
- FR-18: **Excel Export** — same as above, `.xlsx` format with basic formatting (header row bold, currency-formatted amount column).
- FR-19: **Responsive Design** — usable on mobile widths (~375px) through desktop; tables collapse to cards on small screens.
- FR-20: **Toast Notifications** — success/error feedback for all mutations (create/update/delete transaction or category, login/logout).
- FR-21: **Skeleton Loaders** — replace spinners with content-shaped skeletons for transaction list, summary cards, category list while fetching.
- FR-22: **Empty States** — dedicated illustration/message + CTA when a user has no transactions yet, no categories match a filter, etc. (not just a blank table).
- FR-23: **Proper Error Handling** — API errors surface as toasts with human-readable messages; unexpected errors caught by an error boundary with a fallback UI, not a blank screen.
- FR-24: **Loading Spinners** — for actions without a natural skeleton shape (button-level loading state on submit, e.g. "Saving...").

### 6. Non-Functional Requirements
- NFR-1: All API responses use consistent JSON envelope and correct HTTP status codes.
- NFR-2: Input validation on both client (Zod + React Hook Form) and server (Zod).
- NFR-3: Passwords never logged or returned in API responses.
- NFR-4: RBAC enforced at the middleware/query level, not just hidden in UI.
- NFR-5: App runs fully via `docker compose up` with no manual setup beyond `.env`.
- NFR-6: Basic automated tests for auth and RBAC boundaries.

### 7. Success Criteria (what a grader likely checks)
1. A user cannot read/edit another user's transactions (tested via direct API calls, not just UI).
2. A non-admin cannot create/edit/delete categories (403, not just hidden button).
3. Auth is properly implemented (hashed passwords, valid JWT expiry, protected routes reject missing/invalid tokens).
4. Clean, documented API and schema.
5. App builds and runs via Docker without extra steps.
6. (Polish) The app doesn't flash blank/broken states — loading, empty, and error states are all handled intentionally.
7. (Polish) Exports produce correctly formatted, non-corrupt files that open cleanly in Excel/Sheets.

### 8. Assumptions
- Single currency (INR or USD, configurable via env).
- One user has exactly one role (no multi-role).
- Categories are global (not per-user).

### 9. Open Questions (confirm with evaluator/mentor if possible)
- Should deleted categories cascade-delete transactions, or should transactions retain a category snapshot?
- Is a frontend UI required, or is this primarily an API assessment?
- Is there a grading rubric emphasizing specific parts (auth vs RBAC vs UI polish)?
