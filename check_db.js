import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://squarecloud:4GMCfbhKf4bO1iHmmxxViQh8@square-cloud-db-30b40510823f45d9b12fcfc694e95f27.squareweb.app:7247/squarecloud?schema=public" } }
});

async function check() {
  try {
    await prisma.$connect();
    console.log("Connected successfully!");
    
    // Check if key tables exist
    const result = await prisma.$queryRaw`SELECT count(*) FROM information_schema.tables WHERE table_name = 'payment_webhook_logs';`;
    console.log("PaymentWebhookLog table exists:", result[0].count > 0);
    
    await prisma.$disconnect();
  } catch (e) {
    console.error("Connection failed:", e.message);
    process.exit(1);
  }
}
check();
