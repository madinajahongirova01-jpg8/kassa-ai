-- AlterTable
ALTER TABLE "users" ADD COLUMN     "business_name" TEXT;

-- Business invariants enforced by the database in addition to the service layer.
ALTER TABLE "users" ADD CONSTRAINT "users_business_name_not_blank" CHECK ("business_name" IS NULL OR btrim("business_name") <> '');
