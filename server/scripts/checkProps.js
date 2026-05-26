require('dotenv').config();
const prisma = require('../db');

async function main() {
  const props = await prisma.property.findMany({
    select: {
      id: true,
      title: true,
      pricePerNight: true,
      rating: true,
      reviewCount: true
    }
  });
  
  console.log("Current Database Properties:");
  props.forEach(p => {
    console.log(`[${p.id}] ${p.title}`);
    console.log(`  Price Per Night: $${p.pricePerNight}`);
    console.log(`  Rating: ${p.rating}`);
    console.log(`  Review Count: ${p.reviewCount}`);
    console.log("-----------------------------------------");
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
