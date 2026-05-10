const prisma = require('../db');

async function seedPolicies() {
  const policies = [
    {
      name: 'Flexible',
      type: 'SHORT_TERM',
      fullRefundDaysPrior: 1,
      partialRefundDaysPrior: 0,
      partialRefundPercentage: 0,
      bookingGracePeriodHours: 24,
      offerNonRefundableDiscount: true,
      nonRefundableDiscountPercentage: 10
    },
    {
      name: 'Moderate',
      type: 'SHORT_TERM',
      fullRefundDaysPrior: 5,
      partialRefundDaysPrior: 1,
      partialRefundPercentage: 50,
      bookingGracePeriodHours: 24,
      offerNonRefundableDiscount: true,
      nonRefundableDiscountPercentage: 10
    },
    {
      name: 'Firm',
      type: 'SHORT_TERM',
      fullRefundDaysPrior: 14,
      partialRefundDaysPrior: 7,
      partialRefundPercentage: 50,
      bookingGracePeriodHours: 48,
      offerNonRefundableDiscount: true,
      nonRefundableDiscountPercentage: 10
    },
    {
      name: 'Strict',
      type: 'SHORT_TERM',
      fullRefundDaysPrior: 14,
      partialRefundDaysPrior: 0,
      partialRefundPercentage: 0,
      bookingGracePeriodHours: 48,
      offerNonRefundableDiscount: true,
      nonRefundableDiscountPercentage: 10
    },
    {
      name: 'Long-Term Standard',
      type: 'LONG_TERM',
      fullRefundDaysPrior: 30,
      partialRefundDaysPrior: 0,
      partialRefundPercentage: 0,
      bookingGracePeriodHours: 48,
      offerNonRefundableDiscount: true,
      nonRefundableDiscountPercentage: 10
    }
  ];

  for (const p of policies) {
    // Avoid creating duplicates if they already exist
    const existing = await prisma.cancellationPolicy.findFirst({
      where: { name: p.name }
    });
    
    if (!existing) {
      await prisma.cancellationPolicy.create({ data: p });
      console.log('Created policy:', p.name);
    } else {
      console.log('Policy already exists:', p.name);
    }
  }

  // Apply Moderate and Long-Term Standard to all properties
  const moderate = await prisma.cancellationPolicy.findFirst({ where: { name: 'Moderate' } });
  const longTerm = await prisma.cancellationPolicy.findFirst({ where: { name: 'Long-Term Standard' } });

  if (moderate) {
    const props = await prisma.property.findMany({ select: { id: true } });
    await Promise.all(props.map(p => 
      prisma.property.update({ where: { id: p.id }, data: { shortTermPolicyId: moderate.id } })
    ));
    console.log('Applied Moderate policy to all properties.');
  }

  if (longTerm) {
    const props = await prisma.property.findMany({ select: { id: true } });
    await Promise.all(props.map(p => 
      prisma.property.update({ where: { id: p.id }, data: { longTermPolicyId: longTerm.id } })
    ));
    console.log('Applied Long-Term Standard policy to all properties.');
  }

  console.log('Done!');
}

seedPolicies().finally(() => prisma.$disconnect());
