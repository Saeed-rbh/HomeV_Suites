const prisma = require('./db.js');
async function run() {
  const policies = await prisma.cancellationPolicy.findMany();
  console.log('Policies:', policies);
  const props = await prisma.property.findMany({ select: { id: true, title: true, shortTermPolicyId: true } });
  console.log('Props with policy:', props);
}
run().finally(() => prisma.$disconnect());
