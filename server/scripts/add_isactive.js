require('dotenv').config();
const prisma = require('../db');

async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true');
  console.log('✅ isActive column added (or already exists)');

  // Also update schema.prisma
  console.log('Done. Remember to add isActive to schema.prisma');
}

main().catch(console.error);
