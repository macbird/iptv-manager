-- CreateTable
CREATE TABLE "payment_webhook_logs" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "tenantSlug" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mercadopago',
    "httpMethod" TEXT NOT NULL,
    "paymentId" TEXT,
    "statusCode" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "detail" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_webhook_logs_accountId_createdAt_idx" ON "payment_webhook_logs"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "payment_webhook_logs_tenantSlug_createdAt_idx" ON "payment_webhook_logs"("tenantSlug", "createdAt");

-- AddForeignKey
ALTER TABLE "payment_webhook_logs" ADD CONSTRAINT "payment_webhook_logs_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
