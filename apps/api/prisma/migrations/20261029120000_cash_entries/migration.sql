-- CreateEnum
CREATE TYPE "CashEntryKind" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "CashCategory" AS ENUM ('SALE', 'GOODS', 'SALARY', 'UTILITIES', 'TRANSPORT', 'RENT', 'OTHER');

-- CreateEnum
CREATE TYPE "EntrySource" AS ENUM ('VOICE', 'TEXT', 'PHOTO');

-- CreateTable
CREATE TABLE "cash_entries" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "kind" "CashEntryKind" NOT NULL,
    "category" "CashCategory" NOT NULL,
    "amount_dirams" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "occurred_on" DATE NOT NULL,
    "source" "EntrySource" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_entries_owner_id_occurred_on_idx" ON "cash_entries"("owner_id", "occurred_on");

-- AddForeignKey
ALTER TABLE "cash_entries" ADD CONSTRAINT "cash_entries_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Business invariants enforced by the database in addition to the service layer.
ALTER TABLE "cash_entries" ADD CONSTRAINT "cash_entries_amount_positive" CHECK ("amount_dirams" > 0);
ALTER TABLE "cash_entries" ADD CONSTRAINT "cash_entries_title_not_blank" CHECK (btrim("title") <> '');
