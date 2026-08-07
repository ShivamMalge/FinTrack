# Architecture Document
## Personal Finance Tracker

### 1. High-Level Architecture

```
┌─────────────────┐        HTTPS/JSON        ┌──────────────────┐        ┌──────────────┐
│   Next.js App    │ ───────────────────────▶ │  Express API      │ ─────▶ │  PostgreSQL   │
│  (App Router)     │ ◀─────────────────────── │  (Node + TS)      │ ◀───── │  (via Prisma) │
│  React Query      │        JWT in header      │  RBAC middleware  │        └──────────────┘
└─────────────────┘                            └──────────────────┘
        │                                                │
        │                                                │
   Zod validation                                  Zod validation
   (client-side UX)                              (server-side, source of truth)
```

- **Frontend (Next.js)**: Renders UI, manages client state via TanStack Query, calls the Express API. Route guards redirect based on role, but this is UX only — never trust the client for authorization.
- **Backend (Express)**: Stateless REST API. All authorization decisions happen here, in middleware and query filters.
- **Database (PostgreSQL)**: Single source of truth, accessed exclusively through Prisma from the backend.

### 2. Request Flow (example: User creates a transaction)
1. Frontend form validated with React Hook Form + Zod.
2. `POST /api/transactions` sent with `Authorization: Bearer <JWT>`.
3. Express `authenticate` middleware verifies JWT signature + expiry, attaches `req.user = { id, role }`.
4. Express `requireRole('user')` (or equivalent) middleware — for this route any authenticated user is fine, but the handler always scopes writes to `req.user.id`, never a client-supplied `userId`.
5. Zod schema validates request body server-side.
6. Prisma inserts transaction with `userId: req.user.id` (never trust body for this field).
7. Response returned with the created record.

### 3. Request Flow (example: User tries to delete another user's transaction)
1. `DELETE /api/transactions/:id` with valid JWT for user A.
2. Middleware authenticates, sets `req.user.id = A`.
3. Handler queries: `prisma.transaction.findFirst({ where: { id, userId: req.user.id } })`.
4. If no match (because the transaction belongs to user B), return `404` (not `403` — avoid leaking existence of other users' records).
5. This pattern — always filtering by `userId` in the query itself, not just checking after fetch — is the core IDOR defense.

### 4. Backend Layered Structure

```
src/
├── config/          # env loading, db client singleton
├── middleware/       # auth.ts, requireRole.ts, errorHandler.ts, validate.ts
├── modules/
│   ├── auth/          # controller, service, routes, dto (zod schemas)
│   ├── users/
│   ├── categories/
│   └── transactions/
├── prisma/            # schema.prisma, migrations, seed.ts
├── utils/             # jwt.ts, hash.ts, apiResponse.ts
└── app.ts / server.ts
```

Each module follows: `routes → controller → service → prisma`.
- **Controller**: parses request, calls service, shapes response. No business logic.
- **Service**: business logic, authorization checks that need domain knowledge, calls Prisma.
- Keeps controllers thin and services testable without HTTP mocking.

### 5. Frontend Structure

```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── transactions/
│   ├── categories/        # admin-only route, guarded
│   └── summary/
├── components/
│   ├── ui/                 # shadcn components
│   └── forms/
├── lib/
│   ├── api.ts               # fetch wrapper, attaches JWT
│   ├── auth.ts               # session/token helpers
│   └── validators/            # shared zod schemas (can mirror backend dto)
└── hooks/                     # useTransactions, useCategories (TanStack Query)
```

### 6. Authentication & Session Strategy
- JWT stored in an **httpOnly, Secure cookie** (safer than localStorage against XSS) set by the backend on login.
- Access token short-lived (e.g., 15 min). Optional refresh token (longer-lived, rotated) for a smoother UX — can be scoped out for v1 if time-boxed.
- Next.js middleware (`middleware.ts`) reads the cookie to gate `(dashboard)` routes for UX; real enforcement remains server-side.

### 7. Authorization Model (RBAC)
- Two roles: `ADMIN`, `USER`, stored on the `User` model.
- Middleware `requireRole(...roles)` checks `req.user.role` against an allowlist.
- Row-level scoping for transactions always additionally filters by `userId`, independent of role checks — this covers the "user can only touch their own data" rule which role checks alone don't express.

### 8. Error Handling
- Central `errorHandler` middleware converts thrown errors (validation, Prisma, custom `AppError`) into a consistent JSON shape:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```
- Validation errors → 400, Auth missing/invalid → 401, Authorization failure (wrong role) → 403, Not found or not owned → 404.

### 9. Deployment (Docker Compose)
Three services: `frontend`, `backend`, `db` (Postgres), sharing a Docker network. Backend runs `prisma migrate deploy` on startup (or as an init container/entrypoint script) before starting the server.

### 10. Frontend UX Layer (Extra Features)

- **Theme**: `next-themes` wraps the app root; theme choice persisted in a cookie so SSR renders the correct theme on first paint (avoids flash-of-wrong-theme).
- **Toasts**: a single `<Toaster />` mounted at the root layout. Every TanStack Query mutation's `onSuccess`/`onError` fires a toast — centralize this in a `useApiMutation` wrapper hook rather than repeating toast calls in every component.
- **Skeletons vs Spinners**: use skeletons for *content* that has a predictable shape (transaction list, summary cards) — driven by `isLoading` from TanStack Query. Use spinners for *actions* (button says "Saving..." with a small spinner) — driven by `isPending` on the mutation.
- **Empty states**: each list view (`transactions`, `categories`) renders a dedicated empty-state component when `data.length === 0`, distinct from the loading skeleton — never let an empty array silently render nothing.
- **Error boundaries**: a top-level `error.tsx` (Next.js App Router convention) catches unhandled render errors per route segment; API errors that are *expected* (400/403/404) are handled inline via toast, not the error boundary — the boundary is a last resort, not the primary error UX.
- **Export flow**: frontend triggers a plain `<a href>` or `window.open` to `GET /api/transactions/export?...` rather than fetching-then-blob-downloading — simpler, and lets the browser handle the download natively via `Content-Disposition`.

### 11. Security Checklist
- [ ] Passwords hashed with bcrypt (cost factor ≥ 10).
- [ ] JWT secret from env, never committed.
- [ ] Rate limiting on `/auth/login` (e.g., `express-rate-limit`).
- [ ] Helmet middleware for security headers.
- [ ] CORS restricted to the frontend origin.
- [ ] All Prisma queries for user-owned resources filtered by `userId`.
- [ ] Zod validation on every mutating endpoint.
