require('dotenv').config();
const prisma = require('../db');

async function main() {
  const res = await prisma.$queryRawUnsafe('SELECT * FROM "Property" LIMIT 1');
  console.log('Columns:', Object.keys(res[0] || {}));
}

main().catch(console.error);
