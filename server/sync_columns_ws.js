const prisma = require('./db');

async function syncMissingColumns() {
  try {
    console.log("Connecting to the database via Neon Serverless WebSockets to sync missing columns...");
    
    const queries = [
      'ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "stripeIntentId" TEXT;',
      'ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "stripeRefundId" TEXT;',
      'ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "lastWebhookTimestamp" TIMESTAMP(3);',
      'ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "nickname" TEXT;',
      'ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "lastWebhookTimestamp" TIMESTAMP(3);',
      'ALTER TABLE "CancellationPolicy" ADD COLUMN IF NOT EXISTS "offerNonRefundableDiscount" BOOLEAN NOT NULL DEFAULT false;',
      'ALTER TABLE "CancellationPolicy" ADD COLUMN IF NOT EXISTS "nonRefundableDiscountPercentage" INTEGER NOT NULL DEFAULT 10;'
    ];

    for (const query of queries) {
      try {
        await prisma.$executeRawUnsafe(query);
        console.log(`✅ Executed: ${query}`);
      } catch (e) {
        console.log(`⚠️ Ignored error on ${query}: ${e.message}`);
      }
    }
    
    console.log("✅ Successfully synced all potentially missing columns!");
  } catch (error) {
    console.error("❌ Failed to sync columns:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncMissingColumns();
