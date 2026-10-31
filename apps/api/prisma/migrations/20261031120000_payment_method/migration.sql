-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "method" "PaymentMethod" NOT NULL DEFAULT 'CASH';
