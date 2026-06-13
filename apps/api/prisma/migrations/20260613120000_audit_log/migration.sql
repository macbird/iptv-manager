-- Tenant audit log for critical actions (Fase 5 / P0.4)

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountUserId" TEXT,
    "entityType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit_logs"("tenantId", "createdAt" DESC);

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_accountUserId_fkey" FOREIGN KEY ("accountUserId") REFERENCES "account_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
