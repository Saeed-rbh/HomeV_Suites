const prisma = require('./db');

async function run() {
  const count = await prisma.reservation.count();
  console.log("Total Reservations:", count);
  const all = await prisma.reservation.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  console.log(JSON.stringify(all, null, 2));
  await prisma.$disconnect();
}
run();
