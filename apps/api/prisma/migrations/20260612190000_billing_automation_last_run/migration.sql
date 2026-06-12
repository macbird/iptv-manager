-- Per-tenant billing automation observability (last run snapshot)
ALTER TABLE "tenant_billing_automation_config"
ADD COLUMN "lastAutomationRunAt" TIMESTAMP(3),
ADD COLUMN "lastAutomationRunSummary" JSONB;
