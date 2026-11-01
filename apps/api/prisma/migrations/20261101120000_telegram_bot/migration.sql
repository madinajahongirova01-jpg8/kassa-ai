-- CreateEnum
CREATE TYPE "TelegramAccountStatus" AS ENUM ('ACTIVE', 'STOPPED');

-- CreateEnum
CREATE TYPE "TelegramLanguage" AS ENUM ('TG', 'RU', 'EN');

-- CreateEnum
CREATE TYPE "TelegramTransactionType" AS ENUM ('SALE', 'EXPENSE', 'CREDIT_SALE', 'DEBT_PAYMENT');

-- CreateEnum
CREATE TYPE "TelegramTransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "telegram_accounts" (
    "id" SERIAL NOT NULL,
    "telegram_user_id" BIGINT NOT NULL,
    "telegram_chat_id" BIGINT NOT NULL,
    "first_name" TEXT,
    "status" "TelegramAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "language" "TelegramLanguage",
    "last_reminder_on" DATE,
    "user_id" UUID,
    "linked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_link_codes" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_link_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_transactions" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "type" "TelegramTransactionType" NOT NULL,
    "amount_dirams" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "customer_name" TEXT,
    "status" "TelegramTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synced_at" TIMESTAMP(3),
    "cash_entry_id" UUID,
    "debt_id" UUID,
    "payment_group_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_link_attempts" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_link_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_accounts_telegram_user_id_key" ON "telegram_accounts"("telegram_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_accounts_user_id_key" ON "telegram_accounts"("user_id");

-- CreateIndex
CREATE INDEX "telegram_accounts_status_last_reminder_on_idx" ON "telegram_accounts"("status", "last_reminder_on");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_link_codes_code_hash_key" ON "telegram_link_codes"("code_hash");

-- CreateIndex
CREATE INDEX "telegram_link_codes_account_id_idx" ON "telegram_link_codes"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_transactions_cash_entry_id_key" ON "telegram_transactions"("cash_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_transactions_debt_id_key" ON "telegram_transactions"("debt_id");

-- CreateIndex
CREATE INDEX "telegram_transactions_account_id_status_occurred_at_idx" ON "telegram_transactions"("account_id", "status", "occurred_at");

-- CreateIndex
CREATE INDEX "telegram_link_attempts_user_id_attempted_at_idx" ON "telegram_link_attempts"("user_id", "attempted_at");

-- AddForeignKey
ALTER TABLE "telegram_accounts" ADD CONSTRAINT "telegram_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_link_codes" ADD CONSTRAINT "telegram_link_codes_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "telegram_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_transactions" ADD CONSTRAINT "telegram_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "telegram_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_transactions" ADD CONSTRAINT "telegram_transactions_cash_entry_id_fkey" FOREIGN KEY ("cash_entry_id") REFERENCES "cash_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_transactions" ADD CONSTRAINT "telegram_transactions_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_link_attempts" ADD CONSTRAINT "telegram_link_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;



-- Business invariants enforced by the database in addition to the service layer.
ALTER TABLE "telegram_accounts" ADD CONSTRAINT "telegram_accounts_telegram_user_id_positive" CHECK ("telegram_user_id" > 0);

ALTER TABLE "telegram_link_codes" ADD CONSTRAINT "telegram_link_codes_expires_after_created" CHECK ("expires_at" > "created_at");

ALTER TABLE "telegram_transactions" ADD CONSTRAINT "telegram_transactions_amount_positive" CHECK ("amount_dirams" > 0);
ALTER TABLE "telegram_transactions" ADD CONSTRAINT "telegram_transactions_description_not_blank" CHECK (btrim("description") <> '');
ALTER TABLE "telegram_transactions" ADD CONSTRAINT "telegram_transactions_customer_required" CHECK (
    "type" NOT IN ('CREDIT_SALE', 'DEBT_PAYMENT') OR ("customer_name" IS NOT NULL AND btrim("customer_name") <> '')
);
ALTER TABLE "telegram_transactions" ADD CONSTRAINT "telegram_transactions_synced_only_confirmed" CHECK ("synced_at" IS NULL OR "status" = 'CONFIRMED');
-- Each type may only point at the Kassa record it creates: a nasia (credit sale) never becomes a cash entry.
ALTER TABLE "telegram_transactions" ADD CONSTRAINT "telegram_transactions_cash_entry_matches_type" CHECK ("cash_entry_id" IS NULL OR "type" IN ('SALE', 'EXPENSE'));
ALTER TABLE "telegram_transactions" ADD CONSTRAINT "telegram_transactions_debt_matches_type" CHECK ("debt_id" IS NULL OR "type" = 'CREDIT_SALE');
ALTER TABLE "telegram_transactions" ADD CONSTRAINT "telegram_transactions_payment_matches_type" CHECK ("payment_group_id" IS NULL OR "type" = 'DEBT_PAYMENT');
