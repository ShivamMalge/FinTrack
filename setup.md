# Setup & Environment
## Personal Finance Tracker

### 1. Repository Layout (suggested monorepo)

```
finance-tracker/
├── frontend/               # Next.js app
├── backend/                # Express + Prisma app
│   └── prisma/
├── docker-compose.yml
├── .env.example
└── README.md
```

Monorepo with two top-level apps keeps Docker Compose simple; a full workspace tool (Turborepo/pnpm workspaces) is optional polish, not required for this scope.

### 2. Environment Variables

**backend/.env**
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/finance_tracker
JWT_SECRET=<generate a long random string>
JWT_EXPIRES_IN=15m
PORT=4001
FRONTEND_ORIGIN=http://localhost:3000
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:4001/api
```

### 3. docker-compose.yml (outline)

```yaml
version: "3.9"
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: finance_tracker
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    env_file: ./backend/.env
    depends_on:
      - db
    ports:
      - "4001:4001"
    command: sh -c "npx prisma migrate deploy && npx prisma db seed && node dist/server.js"

  frontend:
    build: ./frontend
    env_file: ./frontend/.env.local
    depends_on:
      - backend
    ports:
      - "3000:3000"

volumes:
  pgdata:
```

### 4. Local Dev Without Docker (faster iteration)
1. `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16` (just the DB in a container)
2. `cd backend && npm i && npx prisma migrate dev && npm run seed && npm run dev`
3. `cd frontend && npm i && npm run dev`

### 5. Order of Operations (for a from-scratch build)
1. Scaffold `backend/` — Express + TS + Prisma, get `/health` endpoint returning 200.
2. Write `prisma/schema.prisma`, run first migration against local Postgres.
3. Build `auth` module (register/login/me) end-to-end, test with curl/Postman before touching frontend.
4. Build `categories` module with RBAC middleware — verify 403s with a non-admin token.
5. Build `transactions` module — verify IDOR protection with two different user tokens.
6. Only then scaffold `frontend/` and wire it to the working API.
7. Add `docker-compose.yml` last, once both apps run standalone.

This order front-loads the parts most likely to be graded closely (auth, RBAC, data isolation) and treats the UI as the final layer, not the first thing built.

### 6. Suggested README.md sections (for the submission itself)
- Project description (1-2 lines)
- Tech stack summary
- How to run (`docker compose up`)
- Default seeded credentials (admin + user) for the grader to log in with
- API summary or link to `api-spec.md`
- Any known limitations / things you'd improve with more time
