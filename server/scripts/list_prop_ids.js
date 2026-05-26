require('dotenv').config();
const prisma = require('../db');

async function main() {
  const props = await prisma.property.findMany({ select: { id: true, externalId: true, title: true } });
  console.log(JSON.stringify(props, null, 2));
}

main().catch(console.error);
