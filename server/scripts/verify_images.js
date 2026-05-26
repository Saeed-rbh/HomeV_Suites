require('dotenv').config();
const prisma = require('../db');

async function main() {
  const props = await prisma.property.findMany({
    select: { id: true, title: true, thumbnailUrl: true, images: true }
  });
  props.forEach(p => {
    const imgs = p.images ? JSON.parse(p.images) : [];
    console.log(`[${p.id}] ${p.title}`);
    console.log(`  images: ${imgs.length}, thumb: ${p.thumbnailUrl ? '✅' : '❌ null'}`);
  });
}

main().catch(console.error);
