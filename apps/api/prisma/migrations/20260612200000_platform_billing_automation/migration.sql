-- Platform SaaS billing automation (monthly invoices + optional WhatsApp)

CREATE TABLE "platform_billing_automation_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "sendWhatsapp" BOOLEAN NOT NULL DEFAULT true,
    "sendPaymentCharge" BOOLEAN NOT NULL DEFAULT true,
    "automationRunHour" INTEGER NOT NULL DEFAULT 9,
    "automationRunMinute" INTEGER NOT NULL DEFAULT 0,
    "chargeMessageTemplates" JSONB,
    "chargeMessageDelayMs" INTEGER NOT NULL DEFAULT 1500,
    "suspendOverdueAccounts" BOOLEAN NOT NULL DEFAULT false,
    "lastAutomationRunAt" TIMESTAMP(3),
    "lastAutomationRunSummary" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_billing_automation_config_pkey" PRIMARY KEY ("id")
);

INSERT INTO "platform_billing_automation_config" ("id", "active", "updatedAt")
VALUES ('default', false, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
