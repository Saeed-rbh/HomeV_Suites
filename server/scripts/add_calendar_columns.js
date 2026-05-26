require('dotenv').config();
const prisma = require('../db');

async function main() {
  console.log('[Migration] Adding calendar columns to Property table...');
  
  await prisma.$executeRawUnsafe('ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "blockedDates" TEXT DEFAULT \'[]\'');
  await prisma.$executeRawUnsafe('ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "calendarRates" TEXT DEFAULT \'{}\'');
  await prisma.$executeRawUnsafe('ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "calendarMinStays" TEXT DEFAULT \'{}\'');
  
  console.log('✅ Calendar columns added successfully (or already existed).');
}

main().catch(e => {
  console.error('[Migration] Failed:', e.message);
  process.exit(1);
});
