-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "created_by" UUID;

UPDATE "tasks" AS t
SET "created_by" = p.owner_id
FROM "projects" AS p
WHERE t.project_id = p.id AND t.created_by IS NULL;

ALTER TABLE "tasks" ALTER COLUMN "created_by" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
