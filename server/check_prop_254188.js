const prisma = require('./db');

async function run() {
  const p = await prisma.property.findUnique({ where: { id: '254188' } });
  console.log(JSON.stringify(p, null, 2));
  await prisma.$disconnect();
}
run();
