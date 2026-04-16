-- Idempotent: aligns DB with Prisma schema when `tasks.created_by` is missing
-- (e.g. DB created from init migration only). Safe to run after every `migrate deploy`.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'tasks'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tasks'
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE "tasks" ADD COLUMN "created_by" UUID;
    UPDATE "tasks" AS t
    SET "created_by" = p."owner_id"
    FROM "projects" AS p
    WHERE t."project_id" = p."id"
      AND t."created_by" IS NULL;
    ALTER TABLE "tasks" ALTER COLUMN "created_by" SET NOT NULL;
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_created_by_fkey"
      FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
