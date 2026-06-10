-- AlterTable
ALTER TABLE "tenant_billing_automation_config"
ADD COLUMN "closeSubscriptionInvoiceAfterDays" INTEGER NOT NULL DEFAULT 30;
