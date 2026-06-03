-- Remove duplicate activation tasks (keep oldest per payment)
DELETE FROM "connection_renewal_tasks" a
USING "connection_renewal_tasks" b
WHERE a."paymentId" = b."paymentId" AND a."id" > b."id";

-- Drop per-connection unique index
DROP INDEX IF EXISTS "connection_renewal_tasks_paymentId_connectionId_key";

-- One activation per payment
CREATE UNIQUE INDEX "connection_renewal_tasks_paymentId_key" ON "connection_renewal_tasks"("paymentId");

-- Activation is per payment, not per connection
ALTER TABLE "connection_renewal_tasks" ALTER COLUMN "connectionId" DROP NOT NULL;
