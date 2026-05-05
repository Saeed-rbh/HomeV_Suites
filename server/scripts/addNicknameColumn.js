const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function addColumn() {
  try {
    await sql`ALTER TABLE "Property" ADD COLUMN "nickname" TEXT;`;
    console.log('Column "nickname" added successfully.');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Column "nickname" already exists.');
    } else {
      console.error('Error adding column:', error);
    }
  }
}

addColumn();
