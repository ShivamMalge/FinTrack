# agents.md
## Instructions for AI coding agents (Claude Code / Antigravity / similar) working on this repo

This file exists because the project is built with agent assistance. It sets ground rules so the agent produces verifiable, non-drifted output instead of confident-sounding code that hasn't actually been checked.

---

### 1. Source of Truth
These documents are authoritative, in this order of precedence if they ever conflict:
1. `schema.md` / `prisma/schema.prisma` — the schema is the actual source of truth once migrations exist; `schema.md` describes intent.
2. `api-spec.md` — exact contract for every endpoint. Do not invent routes, response shapes, or status codes not listed here without flagging it.
3. `architecture.md` — layering, folder structure, auth strategy.
4. `phases.md` — build order and gates. **Do not skip ahead to a later phase's work** even if it seems easy to combine — the gates exist to catch RBAC/IDOR bugs early, before they're buried under UI code.
5. `prd.md` — feature scope. If a request seems to be asking for something outside this scope, say so rather than silently expanding scope.

If asked to do something that contradicts one of these documents, flag the contradiction explicitly rather than silently picking one interpretation.

---

### 2. Non-Negotiable Rules (specific to this project)

- **Never trust a client-supplied `userId` or `role`.** Every write to `Transaction` must use `req.user.id` from the verified JWT, never a value from the request body. This is the single most likely place for an agent to introduce a security bug by "helpfully" accepting a `userId` field from the frontend.
- **Every transaction query must be filtered by `userId` in the Prisma `where` clause itself**, not fetched-then-checked in application code. `findFirst({ where: { id, userId } })`, not `findUnique({ where: { id } })` followed by an `if (record.userId !== req.user.id)` check — the latter is easy to get wrong and easy to accidentally remove in a later edit.
- **Money is `Decimal`, never `Float` or `number` in the DB layer.** If you see JS floating-point arithmetic being done directly on amounts (e.g., summing with `+=` on raw numbers pulled from Prisma), flag it — Prisma's `Decimal` type needs `.toNumber()` or a decimal library for arithmetic, not naive addition.
- **Do not implement password reset, OAuth, or refresh-token rotation unless explicitly asked.** These are out of scope per `prd.md` §3 and add complexity that isn't being graded.
- **Do not add new npm dependencies not listed in `techstack.md`** without calling it out first — the stack was chosen deliberately; substituting e.g. NextAuth for hand-rolled JWT defeats the purpose of the assignment.

---

### 3. Verification Discipline (apply at every phase gate in `phases.md`)

Do not report a phase as complete based on test counts, "should work now," or reading the code back. Verification means:

- **For backend endpoints**: actual `curl` (or equivalent) output pasted/shown, with the real HTTP status code and JSON body — not a paraphrase of what it should return.
- **For RBAC/IDOR checks specifically**: show the request made with a *specific* user's token against a *specific* other user's resource ID, and the actual response. "It returns 404 as expected" without showing the request/response is not verification.
- **For schema changes**: show the actual generated migration SQL, not just the Prisma schema diff — floating-point vs Decimal, cascade rules, and index choices are easy to get subtly wrong in the generated SQL even when the `.prisma` file looks right.
- **For frontend states** (loading/empty/error): describe or screenshot the actual rendered state under the actual condition (e.g., throttled network, empty DB table) — not just "the component handles this case" based on reading the JSX.

If a verification step can't be run in the current environment, say so explicitly rather than asserting the result.

---

### 4. Folder & Naming Conventions
Follow `architecture.md` §4–5 exactly:
- Backend: `routes → controller → service → prisma`, one folder per module under `src/modules/`.
- Frontend: Next.js App Router groups `(auth)` and `(dashboard)`, shared UI in `components/`, data hooks in `hooks/`.
- Zod schemas for a given resource should be defined once and reused for both the backend DTO validation and (where practical) the frontend form validation — don't let the two drift into different shapes.

---

### 5. When the Agent Should Stop and Ask
- Before adding any dependency not in `techstack.md`.
- Before changing the Prisma schema in a way not reflected in `schema.md` (e.g., changing cascade behavior, adding a new model).
- Before combining or skipping a phase gate from `phases.md`.
- If a request implies weakening an RBAC/ownership check "just for now" or "to make the demo easier" — this is exactly the kind of change that accidentally ships.

---

### 6. Commit Hygiene (if agent is committing directly)
- One logical change per commit, scoped to a single phase/module where possible.
- Commit messages reference the phase (e.g., `phase-3: scope transaction queries by userId, add IDOR test`).
- Never commit `.env` files — confirm `.gitignore` covers `.env`, `.env.local` before the first commit.
