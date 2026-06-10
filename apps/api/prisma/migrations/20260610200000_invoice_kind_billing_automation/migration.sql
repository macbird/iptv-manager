-- CreateEnum
CREATE TYPE "InvoiceKind" AS ENUM ('subscription', 'one_off');

-- AlterTable
ALTER TABLE "invoices"
ADD COLUMN "kind" "InvoiceKind" NOT NULL DEFAULT 'subscription',
ADD COLUMN "description" TEXT,
ADD COLUMN "chargeMessageTemplates" JSONB,
ADD COLUMN "chargeMessageDelayMs" INTEGER;

-- AlterTable
ALTER TABLE "tenant_billing_automation_config"
ADD COLUMN "oneOffMessageTemplates" JSONB,
ADD COLUMN "automationRunHour" INTEGER NOT NULL DEFAULT 9,
ADD COLUMN "automationRunMinute" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "autoCloseSubscriptionInvoices" BOOLEAN NOT NULL DEFAULT false;

-- DropIndex
DROP INDEX IF EXISTS "invoices_active_cycle_key";

-- Only one active subscription invoice per billing cycle
CREATE UNIQUE INDEX "invoices_active_subscription_cycle_key"
ON "invoices"("scope", "accountId", "customerId", "billingCycleKey")
WHERE "status" <> 'canceled' AND "kind" = 'subscription';

-- CreateTable
CREATE TABLE "invoice_charge_deliveries" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "source" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messagesCount" INTEGER NOT NULL,
    "providerMessageIds" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,

    CONSTRAINT "invoice_charge_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_job_runs" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "summary" JSONB,

    CONSTRAINT "billing_job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoice_charge_deliveries_invoiceId_sentAt_idx" ON "invoice_charge_deliveries"("invoiceId", "sentAt");

-- CreateIndex
CREATE INDEX "billing_job_runs_startedAt_idx" ON "billing_job_runs"("startedAt");

-- CreateIndex
CREATE INDEX "invoices_accountId_kind_status_idx" ON "invoices"("accountId", "kind", "status");

-- AddForeignKey
ALTER TABLE "invoice_charge_deliveries" ADD CONSTRAINT "invoice_charge_deliveries_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
