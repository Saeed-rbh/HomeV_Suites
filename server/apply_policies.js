const prisma = require('./db.js');

async function applyPolicies() {
  const moderate = await prisma.cancellationPolicy.findFirst({ where: { name: 'Moderate' } });
  const longTerm = await prisma.cancellationPolicy.findFirst({ where: { name: 'Long-Term Standard' } });

  const props = await prisma.property.findMany({ select: { id: true } });

  for (const prop of props) {
    await prisma.property.update({
      where: { id: prop.id },
      data: {
        ...(moderate ? { shortTermPolicyId: moderate.id } : {}),
        ...(longTerm ? { longTermPolicyId: longTerm.id } : {})
      }
    });
  }
  
  console.log(`Applied policies to ${props.length} properties.`);
}

applyPolicies().finally(() => prisma.$disconnect());
