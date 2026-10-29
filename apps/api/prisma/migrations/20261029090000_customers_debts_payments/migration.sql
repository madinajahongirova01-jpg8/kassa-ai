-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('ACTIVE', 'PARTIALLY_PAID', 'PAID');

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "amount_dirams" INTEGER NOT NULL,
    "paid_dirams" INTEGER NOT NULL DEFAULT 0,
    "status" "DebtStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT NOT NULL,
    "occurred_on" DATE NOT NULL,
    "due_on" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "debt_id" UUID NOT NULL,
    "amount_dirams" INTEGER NOT NULL,
    "paid_on" DATE NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_owner_id_created_at_idx" ON "customers"("owner_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "customers_id_owner_id_key" ON "customers"("id", "owner_id");

-- CreateIndex
CREATE INDEX "debts_owner_id_status_idx" ON "debts"("owner_id", "status");

-- CreateIndex
CREATE INDEX "debts_customer_id_idx" ON "debts"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "debts_id_owner_id_key" ON "debts"("id", "owner_id");

-- CreateIndex
CREATE INDEX "payments_debt_id_idx" ON "payments"("debt_id");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_customer_id_owner_id_fkey" FOREIGN KEY ("customer_id", "owner_id") REFERENCES "customers"("id", "owner_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_debt_id_owner_id_fkey" FOREIGN KEY ("debt_id", "owner_id") REFERENCES "debts"("id", "owner_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- Business invariants enforced by the database in addition to the service layer.
ALTER TABLE "customers" ADD CONSTRAINT "customers_name_not_blank" CHECK (btrim("name") <> '');

ALTER TABLE "debts" ADD CONSTRAINT "debts_amount_positive" CHECK ("amount_dirams" > 0);
ALTER TABLE "debts" ADD CONSTRAINT "debts_paid_within_amount" CHECK ("paid_dirams" >= 0 AND "paid_dirams" <= "amount_dirams");
ALTER TABLE "debts" ADD CONSTRAINT "debts_status_matches_paid" CHECK (
    ("status" = 'ACTIVE' AND "paid_dirams" = 0)
    OR ("status" = 'PARTIALLY_PAID' AND "paid_dirams" > 0 AND "paid_dirams" < "amount_dirams")
    OR ("status" = 'PAID' AND "paid_dirams" = "amount_dirams")
);
ALTER TABLE "debts" ADD CONSTRAINT "debts_due_not_before_occurred" CHECK ("due_on" IS NULL OR "due_on" >= "occurred_on");
ALTER TABLE "debts" ADD CONSTRAINT "debts_description_not_blank" CHECK (btrim("description") <> '');

ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_positive" CHECK ("amount_dirams" > 0);
