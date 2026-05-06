const prisma = require('./db');

async function createTable() {
  try {
    console.log("Connecting to the database via Neon Serverless WebSockets...");
    
    // Create the SiteSetting table manually using prisma.$executeRawUnsafe
    // This goes through the Neon HTTP/WS adapter so it bypasses the Port 5432 block!
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SiteSetting" (
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
      );
    `);
    
    console.log("✅ Successfully created SiteSetting table!");
  } catch (error) {
    console.error("❌ Failed to create table:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTable();
