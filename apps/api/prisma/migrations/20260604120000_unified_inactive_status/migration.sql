-- Unify deactivation status name across entities (preserve rows; no billing data deleted)

ALTER TYPE "AccountStatus" RENAME VALUE 'suspended' TO 'inactive';
ALTER TYPE "PlanStatus" RENAME VALUE 'archived' TO 'inactive';
ALTER TYPE "CustomerStatus" RENAME VALUE 'cancelled' TO 'inactive';
ALTER TYPE "ServerStatus" ADD VALUE 'inactive';
