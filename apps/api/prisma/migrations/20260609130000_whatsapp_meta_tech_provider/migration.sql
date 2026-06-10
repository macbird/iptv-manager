-- CreateEnum
CREATE TYPE "WhatsAppConnectionStatus" AS ENUM ('disconnected', 'pending', 'connected');

-- AlterTable
ALTER TABLE "platform_whatsapp_config"
ADD COLUMN "wabaId" TEXT,
ADD COLUMN "phoneNumberId" TEXT,
ADD COLUMN "displayPhoneNumber" TEXT,
ADD COLUMN "connectionStatus" "WhatsAppConnectionStatus" NOT NULL DEFAULT 'disconnected',
ADD COLUMN "tokenExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tenant_whatsapp_config"
ADD COLUMN "wabaId" TEXT,
ADD COLUMN "phoneNumberId" TEXT,
ADD COLUMN "displayPhoneNumber" TEXT,
ADD COLUMN "connectionStatus" "WhatsAppConnectionStatus" NOT NULL DEFAULT 'disconnected',
ADD COLUMN "tokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "tenant_whatsapp_config_phoneNumberId_idx" ON "tenant_whatsapp_config"("phoneNumberId");
