require('dotenv').config();
const prisma = require('../db');

async function main() {
  const props = await prisma.property.findMany({
    select: { id: true, title: true, blockedDates: true }
  });
  
  props.forEach(p => {
    const dates = p.blockedDates ? JSON.parse(p.blockedDates) : [];
    console.log(`[${p.id}] ${p.title} -> ${dates.length} blocked dates.`);
    console.log('Sample dates:', dates.slice(0, 10));
  });
}

main().catch(console.error);
