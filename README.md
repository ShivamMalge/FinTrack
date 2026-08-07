# FinTrack

FinTrack is a full-stack, responsive web application for managing personal finances. It provides role-based access control (RBAC), categorized transaction tracking, and detailed summaries, all running seamlessly via a containerized setup.

## How to Run

FinTrack is fully containerized with Docker, meaning no manual database setup or dependency installation is required.

1. Ensure Docker Desktop (or the Docker daemon) is running.
2. Open a terminal in the root directory.
3. Run the following command:
   ```bash
   docker compose up --build -d
   ```

The application will start, the database will automatically migrate, and default seed data will be injected. 
- The frontend will be accessible at: `http://localhost:3000`
- The backend API runs at: `http://localhost:4001`

**To cleanly shut down and reset the database:**
```bash
docker compose down -v
```

## Seeded Credentials

When the application boots via Docker, the following accounts are automatically seeded into the database for immediate testing:

- **Admin Account**: `admin@example.com` / `password123`
- **User Account**: `user@example.com` / `password123`

The Admin account has access to the Role-Based Access Control (RBAC) Dashboard to manage Categories, whereas the User account does not. Both users can track their own transactions independently.

## API Summary

The full OpenAPI/Swagger specification can be found in `api-spec.md`. Below is a brief summary of the core endpoints (all endpoints run under `http://localhost:4001`):

### Auth
- `POST /api/auth/register`: Create a new user account.
- `POST /api/auth/login`: Authenticate and receive a JWT (stored as an HTTP-only cookie).
- `POST /api/auth/logout`: Clear the JWT cookie.
- `GET /api/auth/me`: Get the current authenticated user's profile.

### Categories (Requires Authentication)
- `GET /api/categories`: List all available categories.
- `POST /api/categories`: Create a new category (Requires `ADMIN` role).
- `PUT /api/categories/:id`: Update an existing category (Requires `ADMIN` role).
- `DELETE /api/categories/:id`: Delete a category (Requires `ADMIN` role).

### Transactions (Requires Authentication)
- `GET /api/transactions`: List transactions (with optional filtering by `type`, `categoryId`, `from`, `to`).
- `POST /api/transactions`: Create a new transaction.
- `PUT /api/transactions/:id`: Update a transaction (Users can only update their own).
- `DELETE /api/transactions/:id`: Delete a transaction (Users can only delete their own).
- `GET /api/transactions/export`: Export transactions as CSV or Excel.

### Summary
- `GET /api/summary`: Retrieve aggregated income, expense, and balance totals for the authenticated user.

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM (`@prisma/adapter-pg`)
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Shadcn UI, TanStack Query
- **Deployment**: Docker Compose

## Known Limitations

- **Authentication**: JWTs are issued with a short 15-minute expiration time for security purposes, but there is currently no refresh token flow implemented. Users will be required to log in again after expiration.
- **Pagination**: While the backend API supports pagination for transactions, the frontend UI currently does not utilize pagination controls and loads the default limit.
- **Next.js Warnings**: Due to using Next.js 16 (Canary/Turbopack), there is a deprecation warning on build regarding the `middleware.ts` file convention changing to `proxy.ts` in future versions.
