/**
 * Adds all new columns to the Property table via raw SQL using the Neon HTTP adapter.
 * Safe to run multiple times (uses IF NOT EXISTS / ALTER TABLE ... ADD COLUMN IF NOT EXISTS).
 * Usage: node scripts/migrate_property_columns.js
 */
require('dotenv').config();
const prisma = require('../db');

const columns = [
  // Booking link
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "bookingUrl" TEXT`,

  // Capacity / rooms
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "beds" INTEGER`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "bathrooms" DOUBLE PRECISION`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "minStay" INTEGER DEFAULT 1`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'CAD'`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "propertyType" TEXT DEFAULT 'Apartment'`,

  // Location
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "city" TEXT`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "state" TEXT`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "zipCode" TEXT`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "country" TEXT`,

  // Rating & reviews
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER`,

  // Check-in/out
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "checkInTime" INTEGER DEFAULT 15`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "checkOutTime" INTEGER DEFAULT 11`,

  // Extended JSON columns
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "amenities" TEXT`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "fees" TEXT`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "taxes" TEXT`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "suitability" TEXT`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "discounts" TEXT`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "securityDeposit" TEXT`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "bedTypes" TEXT`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "channelCommissions" TEXT`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "cancellationType" TEXT`,
  `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "cancellationDescription" TEXT`,
];

async function main() {
  console.log(`Running ${columns.length} column additions...\n`);
  for (const sql of columns) {
    const colName = sql.match(/"([^"]+)"\s*$/)?.[1] || sql;
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`  ✅ ${colName}`);
    } catch (err) {
      // Column already exists or other minor issue
      console.warn(`  ⚠️  ${colName}: ${err.message}`);
    }
  }
  console.log('\n🏁 Migration complete!');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
