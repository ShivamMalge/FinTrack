# Build Phases
## Personal Finance Tracker

Sequencing follows the principle established in `setup.md`: prove the risky/gradeable parts (auth, RBAC, data isolation) work via direct API testing *before* any UI is built, and treat polish features as the last layer, not something interleaved throughout.

Each phase has a **gate**: a concrete, verifiable check that must pass (with actual evidence — curl output, screenshot, test run — not just "should work") before moving to the next phase.

---

### Phase 0 — Scaffolding
- Initialize `backend/` (Express + TS) and `frontend/` (Next.js) as separate apps.
- `backend`: `/health` endpoint returns `200 { status: "ok" }`.
- `frontend`: default Next.js page loads.
- Postgres running (local Docker container is fine at this stage; full compose comes later).
- Prisma initialized, connects to DB (`npx prisma db pull` or a trivial migration succeeds).

**Gate:** `curl localhost:4000/health` returns 200. `npx prisma studio` shows an empty but connected DB.

---

### Phase 1 — Schema & Auth
- Implement full `schema.prisma` from `schema.md`, run first migration.
- Build `auth` module: register, login (bcrypt + JWT cookie), `/auth/me`, logout.
- Build `authenticate` middleware.

**Gate:** Via curl/Postman — register two users (one manually promoted to `ADMIN` in DB), log in as each, confirm `/auth/me` returns correct `role`. Confirm a request with no/garbage token gets 401.

---

### Phase 2 — Categories + RBAC
- Build `categories` module (CRUD) and `requireRole('ADMIN')` middleware.
- Seed a handful of categories.

**Gate:** As admin token → create/update/delete category succeeds. As user token → same requests return 403. This is the single most important gate in the whole project — verify it explicitly and keep the raw curl output as evidence.

---

### Phase 3 — Transactions + Ownership Isolation
- Build `transactions` module (CRUD), always scoping queries by `req.user.id`.
- Build `/api/summary` aggregation endpoint.

**Gate:** Create transactions as User A and User B. Confirm User B's token cannot read, update, or delete User A's transaction ID (expect 404, not 200 or 403). This is the IDOR check — don't skip it.

---

### Phase 4 — Export
- Implement `GET /api/transactions/export` (CSV via `json2csv`, XLSX via `exceljs`), reusing the Phase 3 query/filter logic.

**Gate:** Download both formats via curl (`-o out.csv`), open in a spreadsheet app, confirm correct headers, no corrupted rows, amounts formatted as numbers not strings.

---

### Phase 5 — Frontend Core (no polish yet)
- Auth pages (login/register), protected route middleware.
- Transactions list + create/edit form.
- Categories list (+ admin create/edit form, hidden for non-admins).
- Summary/dashboard view.
- Plain fetch/TanStack Query wiring, minimal styling.

**Gate:** Full manual walkthrough as both an admin and a regular user — every FR-1 through FR-14 exercised by hand in the browser, not just imagined.

---

### Phase 6 — Polish / Extra Features
Build in this order — each is additive and low-risk to sequence independently:
1. Toast notifications (wrap mutations).
2. Loading spinners (button-level `isPending` states).
3. Skeleton loaders (list/card `isLoading` states).
4. Empty states (list views, zero-result filters).
5. Error boundaries (`error.tsx` per route segment).
6. Responsive pass (test at 375px, 768px, 1280px — fix breakpoints as found).
7. Dark/light mode (`next-themes` + toggle in header).
8. Export buttons wired into the transactions UI (calls the Phase 4 endpoint).

**Gate:** Resize browser through the three breakpoints above with devtools; toggle theme and confirm no flash-of-unstyled-content; throttle network to "Slow 3G" in devtools and confirm skeletons appear before content, not a blank screen.

---

### Phase 7 — Dockerization
- Write `Dockerfile` for `frontend` and `backend`.
- Write `docker-compose.yml` per `setup.md`.
- Confirm `prisma migrate deploy` + seed run automatically on container start.

**Gate:** On a clean checkout (or after `docker compose down -v`), `docker compose up` alone brings up a fully working app with seeded data — no manual steps.

---

### Phase 8 — Final Pass
- Write submission `README.md` (seeded credentials, how to run, known limitations).
- Sanity-check `.env.example` is complete and `.env` is gitignored.
- Re-run the Phase 2 and Phase 3 RBAC/IDOR gates one final time against the fully built app — regressions here are the most common last-minute grading failure.

**Gate:** A fresh clone + `docker compose up` + manual RBAC/IDOR spot-check, done as if you were the grader.
