// Load environment variables first — must happen before adapter connects.
const path = require('path');
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
}

const { PrismaClient } = require('@prisma/client');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Use the native PostgreSQL connection for Render's internal database URL.
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL.trim() } }
});

module.exports = prisma;
