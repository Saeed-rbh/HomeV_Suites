const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const props = await prisma.property.findMany();
  console.log(props);
}
check().finally(() => prisma.$disconnect());
