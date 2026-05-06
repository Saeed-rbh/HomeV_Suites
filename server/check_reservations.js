const prisma = require('./db');

async function check() {
  const res = await prisma.reservation.findMany({
    include: { transactions: true }
  });
  console.log(JSON.stringify(res, null, 2));
  
  // Clean up broken reservations created during the crash
  const broken = res.filter(r => r.transactions.length === 0 && r.externalId === null);
  for (const b of broken) {
    console.log("Deleting broken orphaned reservation:", b.id);
    await prisma.reservation.delete({ where: { id: b.id } });
  }
  
  await prisma.$disconnect();
}

check();
