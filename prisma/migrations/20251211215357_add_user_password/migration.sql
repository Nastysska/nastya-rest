/*
  Safe migration:

  - Ensures that existing duplicate "name" values in "User" are made unique.
  - Adds the "password" column in a nullable form, fills it for existing rows,
    then enforces NOT NULL.
  - Finally, adds a UNIQUE index on "name".
*/

-- Step 1: make duplicate "name" values unique
WITH duplicates AS (
  SELECT
    id,
    name,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) AS rn
  FROM "User"
)
UPDATE "User" u
SET name = u.name || '_' || u.id
FROM duplicates d
WHERE u.id = d.id
  AND d.rn > 1;

-- Step 2: add the "password" column as NULLable
ALTER TABLE "User"
ADD COLUMN "password" TEXT;

-- Step 3: set a placeholder password for existing rows
-- (existing пользователи всё равно не смогут залогиниться, но это ок для навчального проекту)
UPDATE "User"
SET "password" = ''
WHERE "password" IS NULL;

-- Step 4: enforce NOT NULL constraint on "password"
ALTER TABLE "User"
ALTER COLUMN "password" SET NOT NULL;

-- Step 5: add UNIQUE constraint on "name"
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
