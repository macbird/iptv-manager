-- CreateEnum
CREATE TYPE "PaymentProviderType" AS ENUM ('asaas', 'efi', 'mercadopago');

-- CreateEnum
CREATE TYPE "WhatsAppProviderType" AS ENUM ('evolution', 'meta');

-- CreateEnum
CREATE TYPE "BillingScope" AS ENUM ('platform', 'tenant');

-- CreateEnum
CREATE TYPE "BillingInvoiceStatus" AS ENUM ('draft', 'open', 'paid', 'overdue', 'canceled');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'canceled');

-- CreateTable
CREATE TABLE "platform_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'monthly',
    "maxCustomers" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_payment_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "provider" "PaymentProviderType" NOT NULL DEFAULT 'asaas',
    "apiKey" TEXT,
    "webhookToken" TEXT,
    "overdueDays" INTEGER NOT NULL DEFAULT 7,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_payment_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_whatsapp_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "provider" "WhatsAppProviderType" NOT NULL DEFAULT 'evolution',
    "instanceUrl" TEXT,
    "apiKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_whatsapp_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_subscriptions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "platformPlanId" TEXT NOT NULL,
    "dueDay" INTEGER NOT NULL DEFAULT 10,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_payment_config" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "provider" "PaymentProviderType" NOT NULL DEFAULT 'asaas',
    "apiKey" TEXT,
    "webhookToken" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_payment_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_whatsapp_config" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "provider" "WhatsAppProviderType" NOT NULL DEFAULT 'evolution',
    "instanceUrl" TEXT,
    "apiKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_whatsapp_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "scope" "BillingScope" NOT NULL,
    "accountId" TEXT NOT NULL,
    "customerId" TEXT,
    "billingCycleKey" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "BillingInvoiceStatus" NOT NULL DEFAULT 'open',
    "pixCopyPaste" TEXT,
    "pixQrCodeBase64" TEXT,
    "providerChargeId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_subscriptions_accountId_key" ON "account_subscriptions"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_payment_config_accountId_key" ON "tenant_payment_config"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_whatsapp_config_accountId_key" ON "tenant_whatsapp_config"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_providerChargeId_key" ON "invoices"("providerChargeId");

-- CreateIndex
CREATE INDEX "invoices_accountId_scope_status_idx" ON "invoices"("accountId", "scope", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_scope_accountId_customerId_billingCycleKey_key" ON "invoices"("scope", "accountId", "customerId", "billingCycleKey");

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerPaymentId_key" ON "payments"("providerPaymentId");

-- AddForeignKey
ALTER TABLE "account_subscriptions" ADD CONSTRAINT "account_subscriptions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_subscriptions" ADD CONSTRAINT "account_subscriptions_platformPlanId_fkey" FOREIGN KEY ("platformPlanId") REFERENCES "platform_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_payment_config" ADD CONSTRAINT "tenant_payment_config_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_whatsapp_config" ADD CONSTRAINT "tenant_whatsapp_config_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
