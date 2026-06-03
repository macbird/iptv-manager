-- CreateIndex
CREATE UNIQUE INDEX "connection_renewal_tasks_paymentId_connectionId_key" ON "connection_renewal_tasks"("paymentId", "connectionId");
