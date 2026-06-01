-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "replacesInvoiceId" TEXT;
ALTER TABLE "invoices" ADD COLUMN "canceledAt" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN "cancelReason" TEXT;

-- DropIndex (full unique blocks canceled + replacement in same cycle)
DROP INDEX "invoices_scope_accountId_customerId_billingCycleKey_key";

-- CreateIndex
CREATE UNIQUE INDEX "invoices_replacesInvoiceId_key" ON "invoices"("replacesInvoiceId");

-- Only one active (non-canceled) invoice per billing cycle
CREATE UNIQUE INDEX "invoices_active_cycle_key" ON "invoices"("scope", "accountId", "customerId", "billingCycleKey")
WHERE "status" <> 'canceled';

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_replacesInvoiceId_fkey" FOREIGN KEY ("replacesInvoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
