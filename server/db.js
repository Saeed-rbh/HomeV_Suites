// Load environment variables first — must happen before adapter connects.
const path = require('path');
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
}

const { PrismaClient } = require('@prisma/client');
const { PrismaNeonHTTP } = require('@prisma/adapter-neon');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Use HTTP adapter as it is more reliable in many serverless environments
const adapter = new PrismaNeonHTTP(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
