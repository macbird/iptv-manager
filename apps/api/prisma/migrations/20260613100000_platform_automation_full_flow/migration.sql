-- Enforce full SaaS automation flow: invoice + PIX + WhatsApp

ALTER TABLE "platform_billing_automation_config"
  ALTER COLUMN "sendWhatsapp" SET DEFAULT true;

UPDATE "platform_billing_automation_config"
SET
  "sendWhatsapp" = true,
  "sendPaymentCharge" = true
WHERE "id" = 'default';
