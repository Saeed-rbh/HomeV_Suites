/**
 * Seed images + thumbnailUrl for each property from the existing api_dumps JSON files.
 * Maps old Uplisting property names to current Hostaway-era DB records by name.
 * Usage: node scripts/seed_images.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const prisma = require('../db');

const DUMPS_DIR = path.join(__dirname, '..', 'api_dumps');

async function main() {
  const files = fs.readdirSync(DUMPS_DIR).filter(f => f.startsWith('property_') && f.endsWith('.json'));

  for (const file of files) {
    const dump = JSON.parse(fs.readFileSync(path.join(DUMPS_DIR, file), 'utf-8'));
    const extId = dump._meta?.propertyId;
    const dumpName = dump._meta?.propertyName;
    if (!extId) { console.warn(`⚠️  No propertyId in ${file}, skipping`); continue; }

    // Extract photo URLs sorted by order
    const photos = (dump.includedResources || [])
      .filter(r => r.type === 'photos')
      .sort((a, b) => (a.attributes.order || 0) - (b.attributes.order || 0))
      .map(r => r.attributes.url)
      .filter(Boolean);

    if (!photos.length) { console.warn(`⚠️  No photos found for property ${extId}`); continue; }

    const thumbnailUrl = photos[0];

    // Find property: try externalId first, then match by title (name may differ slightly)
    let prop = await prisma.property.findFirst({
      where: { OR: [{ id: extId }, { externalId: extId }] }
    });

    // Fallback: match by title (case-insensitive contains)
    if (!prop && dumpName) {
      const allProps = await prisma.property.findMany({ select: { id: true, title: true, externalId: true } });
      // Try exact match first, then partial
      prop = allProps.find(p => p.title.toLowerCase() === dumpName.toLowerCase())
          || allProps.find(p => p.title.toLowerCase().includes(dumpName.toLowerCase().split(' ').slice(0, 3).join(' ')));
    }

    if (!prop) {
      console.warn(`⚠️  Could not find DB record for "${dumpName}" (extId=${extId}), skipping`);
      continue;
    }

    await prisma.property.update({
      where: { id: prop.id },
      data: {
        images: JSON.stringify(photos),
        thumbnailUrl
      }
    });

    console.log(`✅ "${prop.title}" (DB id=${prop.id}): saved ${photos.length} images`);
    console.log(`   Thumbnail: ${thumbnailUrl.slice(0, 80)}...`);
  }

  console.log('\n🏁 Done!');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
