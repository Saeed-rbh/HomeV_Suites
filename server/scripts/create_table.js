const { Pool } = require('pg');
require('dotenv').config();

// We use the exact DATABASE_URL that works for normal app operations
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
});

async function createTable() {
  try {
    console.log("Connecting to the database to create SiteSetting table...");
    
    // Create the SiteSetting table manually
    await pool.query(`
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
    await pool.end();
  }
}

createTable();
