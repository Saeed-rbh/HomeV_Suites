// Load environment variables first — must happen before adapter connects.
const path = require('path');
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
}

const { PrismaClient } = require('@prisma/client');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Enable WebSocket for Neon to support interactive transactions ($transaction)
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
