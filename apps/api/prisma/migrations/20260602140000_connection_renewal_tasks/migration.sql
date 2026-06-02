-- AlterEnum
ALTER TYPE "PaymentProviderType" ADD VALUE 'pushinpay';
ALTER TYPE "PaymentProviderType" ADD VALUE 'infinitypay';

-- CreateEnum
CREATE TYPE "ConnectionRenewalStatus" AS ENUM ('pending', 'completed', 'cancelled');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- CreateTable
CREATE TABLE "tenant_billing_automation_config" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "daysBeforeDue" INTEGER NOT NULL DEFAULT 3,
    "sendWhatsapp" BOOLEAN NOT NULL DEFAULT true,
    "sendPaymentCharge" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_billing_automation_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_renewal_tasks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "status" "ConnectionRenewalStatus" NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connection_renewal_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_billing_automation_config_accountId_key" ON "tenant_billing_automation_config"("accountId");

-- CreateIndex
CREATE INDEX "connection_renewal_tasks_tenantId_status_paidAt_idx" ON "connection_renewal_tasks"("tenantId", "status", "paidAt");

-- CreateIndex
CREATE INDEX "connection_renewal_tasks_customerId_status_idx" ON "connection_renewal_tasks"("customerId", "status");

-- AddForeignKey
ALTER TABLE "tenant_billing_automation_config" ADD CONSTRAINT "tenant_billing_automation_config_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_renewal_tasks" ADD CONSTRAINT "connection_renewal_tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_renewal_tasks" ADD CONSTRAINT "connection_renewal_tasks_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_renewal_tasks" ADD CONSTRAINT "connection_renewal_tasks_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_renewal_tasks" ADD CONSTRAINT "connection_renewal_tasks_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_renewal_tasks" ADD CONSTRAINT "connection_renewal_tasks_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
