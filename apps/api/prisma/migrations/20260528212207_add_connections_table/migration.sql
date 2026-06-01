/*
  Warnings:

  - You are about to drop the column `connections` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `serverId` on the `customers` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_serverId_fkey";

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "connections",
DROP COLUMN "serverId";

-- CreateTable
CREATE TABLE "connections" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    "applicationName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
