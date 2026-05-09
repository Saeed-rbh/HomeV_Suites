const prisma = require('./db');

async function addMissingColumn() {
  try {
    console.log("Connecting to the database via Neon Serverless WebSockets to add missing column...");
    
    // Add uplistingBookingId to Reservation table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "uplistingBookingId" TEXT;
    `);
    
    // Add unique constraint (if not exists)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_uplistingBookingId_key" UNIQUE ("uplistingBookingId");
      `);
    } catch (e) {
      console.log("Constraint might already exist, ignoring error:", e.message);
    }
    
    console.log("✅ Successfully added uplistingBookingId column!");
  } catch (error) {
    console.error("❌ Failed to add column:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingColumn();
