# API Specification
## Personal Finance Tracker

Base URL: `/api`
All responses: `{ "success": boolean, "data"?: ..., "error"?: { "code": string, "message": string } }`

---

### Auth

**POST /api/auth/register**
Body: `{ email, password, name }`
- 201 → `{ user: { id, email, name, role } }`
- 409 → email already exists

**POST /api/auth/login**
Body: `{ email, password }`
- 200 → sets httpOnly cookie `token`; body `{ user: { id, email, name, role } }`
- 401 → invalid credentials

**POST /api/auth/logout**
- 200 → clears cookie

**GET /api/auth/me** *(auth required)*
- 200 → `{ user: { id, email, name, role } }`

---

### Categories

**GET /api/categories** *(auth required — any role)*
Query: `?type=INCOME|EXPENSE&includeArchived=false`
- 200 → `{ categories: Category[] }`

**POST /api/categories** *(admin only)*
Body: `{ name, type, icon?, color? }`
- 201 → `{ category }`
- 403 → non-admin
- 409 → duplicate name

**PUT /api/categories/:id** *(admin only)*
Body: partial `{ name?, type?, icon?, color? }`
- 200 → `{ category }`
- 403 → non-admin
- 404 → not found

**DELETE /api/categories/:id** *(admin only)*
- 200 → soft-deletes (`isArchived: true`) if referenced by transactions; hard-deletes if unused
- 403 → non-admin
- 404 → not found

---

### Transactions

**GET /api/transactions** *(auth required)*
Query: `?page=1&pageSize=20&from=DATE&to=DATE&categoryId=&type=`
- 200 → `{ transactions: Transaction[], total, page, pageSize }`
- Always scoped server-side to `req.user.id` regardless of query params.

**POST /api/transactions** *(auth required)*
Body: `{ amount, type, categoryId, date, note? }`
- 201 → `{ transaction }`
- 400 → validation error (e.g., negative amount, invalid categoryId)

**GET /api/transactions/:id** *(auth required, owner only)*
- 200 → `{ transaction }`
- 404 → not found OR not owned (deliberately not 403, to avoid leaking existence)

**PUT /api/transactions/:id** *(auth required, owner only)*
Body: partial `{ amount?, type?, categoryId?, date?, note? }`
- 200 → `{ transaction }`
- 404 → not found or not owned

**DELETE /api/transactions/:id** *(auth required, owner only)*
- 200 → `{ success: true }`
- 404 → not found or not owned

---

### Export

**GET /api/transactions/export** *(auth required)*
Query: `?format=csv|xlsx&from=DATE&to=DATE&categoryId=&type=`
- 200 → binary file stream, `Content-Type: text/csv` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="transactions-<date>.csv"`
- Scoped to `req.user.id` — reuses the same filtered query as `GET /api/transactions`, just piped into a CSV/XLSX serializer instead of JSON.
- 400 → invalid `format` value

---

### Summary

**GET /api/summary** *(auth required)*
Query: `?from=DATE&to=DATE`
- 200 → `{ totalIncome, totalExpense, net, byCategory: [{ categoryId, name, total }] }`
- Scoped to `req.user.id`.

---

### Admin (optional stretch)

**GET /api/admin/stats** *(admin only)*
- 200 → `{ totalUsers, totalTransactions, totalCategories }`
- No individual transaction data exposed here — aggregate only.

---

### Standard Error Codes

| HTTP | code | When |
|------|------|------|
| 400 | `VALIDATION_ERROR` | Zod validation failed |
| 401 | `UNAUTHENTICATED` | Missing/invalid/expired JWT |
| 403 | `FORBIDDEN` | Valid auth, wrong role (e.g., user hitting admin route) |
| 404 | `NOT_FOUND` | Resource missing or not owned by requester |
| 409 | `CONFLICT` | Unique constraint violation |
| 500 | `INTERNAL_ERROR` | Unhandled server error |
