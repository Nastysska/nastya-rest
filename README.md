
# nastya-rest — Expense Tracking REST API

This repository contains a small educational REST API built with **Node.js** and **Express**.
It is used for a series of university labs on backend development.

- **Student group**: IO-35
- **Variant rule**: `variant = groupNumber % 3`
- **Group number**: 35 ⇒ `35 % 3 = 2`
- **Variant 2**: **"user-specific expense categories"** (custom categories per user)

The project is implemented step‑by‑step across four labs:

- **Lab 1** – Basic HTTP server + health-check endpoint.
- **Lab 2** – In-memory REST API for tracking expenses (users, categories, records).
- **Lab 3** – Migration to PostgreSQL + Prisma ORM, input validation and error handling,
  support for **global** and **user-specific** categories according to Variant 2.
- **Lab 4** – Authentication and authorization:
  password hashing, JWT-based access tokens, and protection of all business endpoints.

---

## Tech stack

- **Node.js** 20+
- **Express** 5
- **Prisma ORM** (PostgreSQL)
- **Zod** (input validation)
- **bcryptjs** (password hashing)
- **jsonwebtoken** (JWT access tokens)
- **dotenv** (environment variables)
- **nodemon** (development)
- **Docker / Docker Compose** (PostgreSQL database and optional app container)

---

## Project structure

```text
prisma/
  schema.prisma                # Database schema (User, Category, Record)
  migrations/                  # Migrations for Labs 3–4

src/
  app.js                       # Express app configuration
  index.js                     # Application entry point
  db.js                        # Prisma client instance
  controllers/
    auth.controller.js         # Registration and login (Lab 4)
    users.controller.js        # Users CRUD (protected in Lab 4)
    categories.controller.js   # Categories API (global + user-specific)
    records.controller.js      # Expense records API
  routes/
    index.js                   # GET /
    api/
      health.js                # GET /api/health
      auth.js                  # /auth/register, /auth/login
      users.js                 # /users, /user/:id
      categories.js            # /category, /category?user_id=...
      records.js               # /record, /record/:id
  middlewares/
    auth.js                    # JWT verification and protected routes (Lab 4)
    errorHandler.js            # Centralized error handler
  utils/
    AppError.js                # Simple application error class

assets/                        # Screenshots and additional lab artifacts
postman/                       # Postman collections and environments for labs 2–4
```

---

## Getting started (local)

### 1. Prerequisites

- Node.js 20 or newer
- npm (comes with Node.js)
- Docker (for PostgreSQL via docker-compose)
- PostgreSQL client tools (optional, for manual inspection)

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

The project is configured via a `.env` file in the root of the repository.

Example `.env`:

```env
DATABASE_URL="postgresql://nastya:nastya@localhost:5432/nastya_rest?schema=public"
PORT=3000
NODE_ENV=development
JWT_SECRET="super_secret_jwt_key_change_me"
JWT_EXPIRES_IN="1h"
```

- `DATABASE_URL` – connection string for PostgreSQL (used by Prisma).
- `PORT` – HTTP server port (defaults to `3000` if not set).
- `NODE_ENV` – environment name (`development`, `production`, etc.).
- `JWT_SECRET` – secret key used to sign JWT access tokens.
- `JWT_EXPIRES_IN` – token lifetime (e.g. `1h`, `15m`).

### 4. Running PostgreSQL with Docker

The project includes a `docker-compose.yml` file that provisions a local PostgreSQL instance:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: nastya_rest
      POSTGRES_USER: nastya
      POSTGRES_PASSWORD: nastya
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
```

Start the database:

```bash
docker compose up -d db
```

### 5. Database migrations (Labs 3–4)

Prisma is used as an ORM and migration tool.

Initial setup and migrations in development:

```bash
# apply all pending migrations to the local database
npx prisma migrate dev

# generate Prisma Client
npx prisma generate
```

You can inspect the data using Prisma Studio:

```bash
npx prisma studio
```

### 6. Run in development mode

Uses `nodemon` for automatic restart on file changes:

```bash
npm run dev
```

The server will start at:

```text
http://localhost:3000
```

### 7. Run in production mode (without Docker for app)

```bash
npm start
```

---

## Data model (Lab 3, Variant 2)

The Prisma schema defines three main models:

```prisma
model User {
  id          Int        @id @default(autoincrement())
  name        String     @unique
  password    String
  createdAt   DateTime   @default(now())

  records     Record[]
  categories  Category[] @relation("UserCategories")
}

model Category {
  id        Int       @id @default(autoincrement())
  name      String
  isCustom  Boolean   @default(false)

  ownerId   Int?
  owner     User?     @relation("UserCategories", fields: [ownerId], references: [id])

  records   Record[]
}

model Record {
  id         Int      @id @default(autoincrement())
  userId     Int
  categoryId Int
  amount     Float
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id])
  category   Category @relation(fields: [categoryId], references: [id])
}
```

Interpretation:

- `User` – a person who owns expense records.
- `Category` – an expense category:
  - `isCustom = false`, `ownerId = null` → **global category**, available to everyone.
  - `isCustom = true`, `ownerId = userId` → **user-specific category**, visible only for that user.
- `Record` – a single expense entry linked to a specific user and category.

This corresponds to **Variant 2** from the lab assignment:
user-specific expense categories on top of the global ones.

---

## API overview

### 1. Basic endpoints (Lab 1)

#### `GET /`

Returns a simple JSON greeting.

Example response:

```json
{
  "message": "Hello from Node.js + Express!"
}
```

#### `GET /api/health`

Health-check endpoint with a timestamp.

Example response:

```json
{
  "status": "ok",
  "ts": "2025-01-01T12:34:56.789Z"
}
```

These endpoints are public and do not require authentication.

---

### 2. Authentication & authorization (Lab 4)

Lab 4 introduces password hashing and JWT-based authorization. Users authenticate via
`/auth/register` and `/auth/login`, and all business endpoints are protected by a JWT
middleware.

#### Registration

- **Method**: `POST`
- **URL**: `/auth/register`
- **Body**:

  ```json
  {
    "name": "nastya",
    "password": "secret123"
  }
  ```

- **Behavior**:
  - Validates input using Zod.
  - Checks that there is no existing user with the same `name`.
  - Hashes the password using `bcryptjs`.
  - Creates a new `User` record in the database.
  - Returns sanitized user data and an access token.

- **Example response**:

  ```json
  {
    "user": {
      "id": 1,
      "name": "nastya",
      "createdAt": "2025-01-01T12:00:00.000Z"
    },
    "accessToken": "<JWT token>"
  }
  ```

#### Login

- **Method**: `POST`
- **URL**: `/auth/login`
- **Body**:

  ```json
  {
    "name": "nastya",
    "password": "secret123"
  }
  ```

- **Behavior**:
  - Validates input with Zod.
  - Finds user by `name`.
  - Compares the provided password with the stored hash using `bcryptjs`.
  - If credentials are valid, returns an access token.

- **Example response**:

  ```json
  {
    "accessToken": "<JWT token>"
  }
  ```

#### JWT protection

- All routes except:
  - `GET /`
  - `GET /api/health`
  - `POST /auth/register`
  - `POST /auth/login`
  are protected by the `authMiddleware`.

- The middleware expects the header:

  ```http
  Authorization: Bearer <token>
  ```

- On missing, expired or invalid token the API returns HTTP **401** with JSON similar to:

  ```json
  {
    "description": "Request does not contain an access token.",
    "error": "authorization_required"
  }
  ```

  or

  ```json
  {
    "message": "The token has expired.",
    "error": "token_expired"
  }
  ```

  or

  ```json
  {
    "message": "Signature verification failed.",
    "error": "invalid_token"
  }
  ```

This mirrors the logic required by the lab specification.

---

### 3. Core REST resources (Labs 2–4)

The following resources are implemented as part of Labs 2–4 and, starting from Lab 4,
require a valid JWT access token (except for public endpoints listed above).

#### Users

| Method | URL             | Description                                              |
|--------|-----------------|----------------------------------------------------------|
| GET    | `/users`        | List all users (password is never returned)             |
| GET    | `/user/:userId` | Get a user by id, including their categories            |
| POST   | `/user`         | Create a new user (optional if `/auth/register` is used)|
| DELETE | `/user/:userId` | Delete a user and related records/custom categories     |

**Example `POST /user` body (optional)**

```json
{
  "name": "alice",
  "password": "secret123"
}
```

---

#### Categories (Variant 2: global + user-specific)

| Method | URL                  | Description                                               |
|--------|----------------------|-----------------------------------------------------------|
| GET    | `/category`          | List all categories                                      |
| GET    | `/category?user_id=` | For a user: global + user-specific categories            |
| POST   | `/category`          | Create global or user-specific category                  |
| DELETE | `/category?id=...`   | Delete a category (and its records) by id (query param)  |

**Creating a global category**

```json
{
  "name": "Food"
}
```

Result: `isCustom = false`, `ownerId = null`.

**Creating a user-specific category**

```json
{
  "name": "Gym",
  "userId": 1
}
```

Result: `isCustom = true`, `ownerId = 1`.

**Getting categories for a user**

```http
GET /category?user_id=1
```

Returns all global categories plus categories where `ownerId = 1`.

---

#### Records (expense entries)

| Method | URL                        | Description                                             |
|--------|----------------------------|---------------------------------------------------------|
| GET    | `/record`                  | List records filtered by `user_id` and/or `category_id` |
| GET    | `/record/:recordId`        | Get a single record by id                               |
| POST   | `/record`                  | Create a new expense record                             |
| DELETE | `/record/:recordId`        | Delete a record                                         |

**Query parameters for `GET /record`**

- `user_id` – optional, integer
- `category_id` – optional, integer  
  At least one of these parameters should be provided.

**Example `POST /record` request body**

```json
{
  "userId": 1,
  "categoryId": 2,
  "amount": 123.45
}
```

---

## Validation and error handling

All main POST endpoints use **Zod** schemas for input validation:

- `auth.controller` – validates `name` and `password` on registration and login.
- `users.controller` – validates `name` and `password` when creating a user.
- `categories.controller` – validates `name` and optional `userId` when creating a category.
- `records.controller` – validates `userId`, `categoryId`, and `amount` when creating a record.

On validation failure the API returns HTTP **400** with a JSON body:

```json
{
  "error": "Validation failed",
  "details": [ /* Zod issues */ ]
}
```

Domain errors (non-existing user, category, record) are also returned with a proper HTTP status
(e.g. 404 for "User not found", "Category not found", "Record not found"), using the `AppError`
helper and the centralized `errorHandler` middleware.

---

## Postman collections (Labs 2–4)

The `postman/` folder contains collections and environments for the labs:

- **Lab 2–3** collections:
  - Requests for:
    - Users (`/users`, `/user/:id`, `POST /user`, `DELETE /user/:id`)
    - Categories (`GET /category`, `GET /category?user_id=...`, `POST /category`, `DELETE /category?id=...`)
    - Records (`GET /record`, `GET /record/:id`, `POST /record`, `DELETE /record/:id`)
  - Environments:
    - Local: `baseUrl = http://localhost:3000`
    - Production / Docker / Render: `baseUrl` set to deployment URL.

- **Lab 4** collection (`nastya-rest-lab4.postman_collection.json`):
  - Adds:
    - `Auth / Register` (saves `accessToken` to `{{token}}` in environment).
    - `Auth / Login` (also saves `accessToken` to `{{token}}`).
  - All protected requests automatically include:
    - `Authorization: Bearer {{token}}`.
  - Allows to build a simple **Postman Flow**: register → login → use token for further requests.

---

## Using the Postman flow

Postman flow for Lab2:

![Lab2 flow](./assets/lab2-flow.png)

Postman flow for Lab:

![Lab4 flow](./assets/lab4-flow.png)

---

## Applying Prisma migrations on production (Render)

For production (Render PostgreSQL) the same migrations from `prisma/migrations/` are applied
using Prisma CLI. The typical flow:

1. Obtain the **external database URL** from Render, for example:

   ```text
   postgresql://nastya_rest_db_user:PASSWORD@dpg-d4tj6aogjchc73d37vh0-a.frankfurt-postgres.render.com/nastya_rest_db
   ```

2. From your local machine, run:

   ```bash
   DATABASE_URL="postgresql://nastya_rest_db_user:...@dpg-d4tj6aogjchc73d37vh0-a.frankfurt-postgres.render.com/nastya_rest_db" \
   npx prisma migrate deploy
   ```

   or, alternatively:

   ```bash
   export DATABASE_URL="postgresql://nastya_rest_db_user:...@dpg-d4tj6aogjchc73d37vh0-a.frankfurt-postgres.render.com/nastya_rest_db"
   npx prisma migrate deploy
   unset DATABASE_URL
   ```

   In the Prisma output you should see the production host instead of `localhost`.

3. After all migrations are successfully deployed, the application on Render can use the same
   schema as in development.

You can also configure the Render **start command** to automatically apply migrations on each
deploy, for example:

```bash
npm run migrate:deploy && npm start
```

where in `package.json`:

```json
{
  "scripts": {
    "migrate:deploy": "prisma migrate deploy",
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

---

## Notes and possible extensions

- For Labs 1–4, the API is intentionally simple and focused on:
  - basic REST design,
  - in-memory store (Lab 2),
  - database + ORM + validation + error handling (Lab 3),
  - JWT-based authentication and protection of endpoints (Lab 4),
  - support for **user-specific categories** as required by Variant 2 for group 35.
- Further extensions may include:
  - refresh tokens and token revocation logic,
  - role-based access control (admin vs regular user),
  - rate limiting and request logging.

This README summarizes the implementation details needed for lab defense and review.
