
# nastya-rest — Expense Tracking REST API

This repository contains a small educational REST API built with **Node.js** and **Express**.
It is used for a series of university labs on backend development.

- **Student group**: IO-35
- **Variant rule**: variant = groupNumber % 3
- **Group number**: 35 ⇒ **35 % 3 = 2**
- **Variant 2**: **"user-specific expense categories"** (custom categories per user)

Currently the project implements:

- **Lab 1** – Basic HTTP server + health-check endpoint
- **Lab 2** – In-memory REST API for tracking expenses (users, categories, records)
- **Lab 3** – Migration to PostgreSQL + Prisma ORM, input validation and error handling,
  support for **global** and **user-specific** categories according to Variant 2.

> Lab 4 (authentication/authorization) can reuse the same API and database and add
> JWT-based security on top of the existing endpoints.

---

## Tech stack

- **Node.js** 20+
- **Express** 5
- **Prisma ORM** (PostgreSQL)
- **Zod** (input validation)
- **dotenv** (environment variables)
- **nodemon** (development)
- **Docker / Docker Compose** (PostgreSQL database and optional app container)

---

## Project structure

```text
prisma/
  schema.prisma        # Database schema (User, Category, Record)

src/
  app.js               # Express app configuration
  index.js             # Application entry point
  db.js                # Prisma client instance
  controllers/
    users.controller.js
    categories.controller.js
    records.controller.js
  routes/
    index.js           # GET /
    api/
      health.js        # GET /api/health
      users.js         # /users, /user/:id
      categories.js    # /category
      records.js       # /record, /record/:id
  middlewares/
    errorHandler.js    # Centralized error handler
  utils/
    AppError.js        # Simple application error class

assets/                # Screenshots and additional lab artifacts
postman/               # Postman collections and environments for labs 2–3
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
```

- `DATABASE_URL` – connection string for PostgreSQL (used by Prisma).
- `PORT` – HTTP server port (defaults to `3000` if not set).
- `NODE_ENV` – environment name (`development`, `production`, etc.).

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

### 5. Database migrations (Lab 3)

Prisma is used as an ORM and migration tool.

Initial setup and migration:

```bash
npx prisma migrate dev --name init_lab3
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
  name        String
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

---

### 2. Core REST resources (Labs 2–3)

The following resources are implemented as part of Labs 2–3.

#### Users

| Method | URL             | Description                        |
|--------|-----------------|------------------------------------|
| GET    | `/users`        | List all users                     |
| GET    | `/user/:userId` | Get a user by id                   |
| POST   | `/user`         | Create a new user                  |
| DELETE | `/user/:userId` | Delete a user and related data     |

**Example `POST /user` body**

```json
{
  "name": "Alice"
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

## Validation and error handling (Lab 3)

All main POST endpoints use **Zod** schemas for input validation:

- `users.controller` – validates `name` when creating a user.
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

## Postman collections

The `postman/` folder contains collections and environments for Labs 2–3:

- Requests for:
  - Users (`/users`, `/user/:id`, `POST /user`, `DELETE /user/:id`)
  - Categories (`GET /category`, `GET /category?user_id=...`, `POST /category`, `DELETE /category?id=...`)
  - Records (`GET /record`, `GET /record/:id`, `POST /record`, `DELETE /record/:id`)
- Environments:
  - Local: `baseUrl = http://localhost:3000`
  - Production / Docker: `baseUrl = http://localhost:8080` (or deployment URL)

The collections are also used in **Postman Flows** to demonstrate filtering by user and category.

---

## Using the Postman flow

Postman flow for Lab2:

![Lab2 flow](./assets/lab2-flow.png)

---

## Notes and possible Lab 4 extensions

- For Labs 1–3, the API is intentionally simple and focused on:
  - basic REST design,
  - in-memory store (Lab 2),
  - database + ORM + validation + error handling (Lab 3),
  - support for **user-specific categories** as required by Variant 2 for group 35.
- In Lab 4 this project can be extended with:
  - JWT-based authentication and authorization,
  - protection of endpoints so that each user only sees and manipulates their own data,
  - role-based access (e.g. admin vs regular user).

This README summarizes the implementation details needed for lab defense and review.
