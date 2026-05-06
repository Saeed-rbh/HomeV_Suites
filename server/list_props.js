const prisma = require('./db');

async function run() {
  const props = await prisma.property.findMany();
  console.log(JSON.stringify(props, null, 2));
  await prisma.$disconnect();
}
run();
