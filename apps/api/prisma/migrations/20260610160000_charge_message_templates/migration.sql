-- AlterTable
ALTER TABLE "tenant_billing_automation_config"
ADD COLUMN "chargeMessageTemplates" JSONB NOT NULL DEFAULT '["Olá, {{nome}}!\n\nSua cobrança referente ao ciclo {{ciclo}} está disponível.\nValor: {{valor}}\nVencimento: {{vencimento}}", "{{pix}}"]'::jsonb,
ADD COLUMN "chargeMessageDelayMs" INTEGER NOT NULL DEFAULT 1500;
