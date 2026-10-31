-- AlterTable
ALTER TABLE "payments" ADD COLUMN "cancelled_at" TIMESTAMP(3),
ADD COLUMN "group_id" UUID DEFAULT gen_random_uuid();

-- Backfill: every existing payment becomes its own group
UPDATE "payments" SET "group_id" = "id";

ALTER TABLE "payments" ALTER COLUMN "group_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "payments_group_id_idx" ON "payments"("group_id");
