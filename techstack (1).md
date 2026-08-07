# Tech Stack
## Personal Finance Tracker

### Frontend
| Tech | Purpose |
|------|---------|
| Next.js 15 (App Router) | React framework, SSR/routing, `middleware.ts` for auth-gated routes |
| TypeScript | Type safety across the app |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Accessible, unstyled-then-styled component primitives (forms, dialogs, tables) |
| React Hook Form | Form state + submission handling |
| Zod | Schema validation, shared shape with backend DTOs |
| TanStack Query | Server-state caching, mutations, optimistic updates |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js | Runtime |
| Express.js | HTTP server / routing |
| TypeScript | Type safety, shared types with frontend if using a monorepo |
| Prisma ORM | Type-safe DB access, migrations |

### Database
| Tech | Purpose |
|------|---------|
| PostgreSQL | Relational store — strong fit given relational integrity needs (User–Transaction–Category) |

### Authentication
| Tech | Purpose |
|------|---------|
| JWT (jsonwebtoken) | Stateless auth tokens carrying `userId` + `role` |
| bcrypt | Password hashing |

### DevOps
| Tech | Purpose |
|------|---------|
| Docker | Containerize frontend, backend, db |
| Docker Compose | Orchestrate all three services locally with one command |
| GitHub | Version control, PRs, optionally GitHub Actions for CI (lint/test/build on push) |

### UX / Polish Libraries (Extra Features)
| Tech | Purpose |
|------|---------|
| `next-themes` | Dark/light mode toggle with system-preference detection and no-flash SSR handling |
| `sonner` (or shadcn's built-in toast) | Toast notifications — pairs cleanly with shadcn/ui's design system |
| shadcn/ui `Skeleton` | Skeleton loaders matching the shape of transaction rows, summary cards |
| `react-error-boundary` | Catches render errors, shows fallback UI instead of a blank screen |
| Tailwind responsive utilities (`sm:`, `md:`, `lg:`) | Responsive design; no extra library needed, just disciplined breakpoint usage |

### Export Libraries
| Tech | Purpose |
|------|---------|
| `json2csv` (or hand-rolled CSV serializer) | Server-side CSV generation for `/api/transactions/export?format=csv` |
| `exceljs` | Server-side `.xlsx` generation with header styling and number formatting — safer and more flexible than client-side SheetJS for this use case |

Export is generated **server-side**, not client-side: the backend already enforces `userId` scoping on transaction queries, so reusing that same query path for exports avoids re-implementing the RBAC/ownership filter in the frontend and guarantees a user can never export data that isn't theirs.

### Supporting libraries (recommended additions)
| Tech | Purpose |
|------|---------|
| `helmet` | Security headers on Express |
| `cors` | Restrict API access to frontend origin |
| `express-rate-limit` | Basic brute-force protection on auth routes |
| `pino` or `winston` | Structured logging |
| `vitest` or `jest` + `supertest` | Backend unit/integration tests (esp. RBAC boundary tests) |
| `dotenv` | Env var loading in local dev |

### Why this stack fits the assignment
- Every piece is mainstream, well-documented, and directly testable by an evaluator running `docker compose up`.
- TypeScript end-to-end + Zod gives you validation and type safety without extra ceremony.
- Prisma removes hand-written SQL/migration risk and makes the schema self-documenting.
- JWT + bcrypt is the expected minimum for an auth assignment; no need for OAuth/session-store complexity at this scope.

### Explicitly not used (and why)
- **NextAuth/Auth.js**: adds abstraction that can obscure the auth logic you're meant to demonstrate; hand-rolled JWT auth better shows understanding for an assignment.
- **GraphQL**: unnecessary complexity for a CRUD-shaped app with two roles; REST is clearer to grade.
- **Redis/session store**: not needed since JWT is stateless; only worth adding if you implement refresh-token rotation with a blocklist.
