require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prisma = require('../db');

async function main() {
  const dump = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'api_dumps', 'property_254189_Hotel-Style_Yorkville_Apt_w__Gym.json'), 'utf-8'
  ));

  const photos = (dump.includedResources || [])
    .filter(r => r.type === 'photos')
    .sort((a, b) => (a.attributes.order || 0) - (b.attributes.order || 0))
    .map(r => r.attributes.url)
    .filter(Boolean);

  console.log(`Found ${photos.length} photos`);

  // The Hostaway name is "5 Star Yorkville Apt w/ Gym" — match by id
  const prop = await prisma.property.findFirst({ where: { id: '537322' } });
  console.log('Found prop:', prop?.title);

  await prisma.property.update({
    where: { id: '537322' },
    data: { images: JSON.stringify(photos), thumbnailUrl: photos[0] }
  });

  console.log(`✅ Saved ${photos.length} images to "5 Star Yorkville Apt w/ Gym" (id=537322)`);
}

main().catch(console.error);
