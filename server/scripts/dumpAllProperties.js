/**
 * Dump ALL data from Uplisting API for every property into individual JSON files.
 * Usage: node scripts/dumpAllProperties.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { fetchGlobalData, fetchPropertyData } = require('../services/uplistingService');

const OUTPUT_DIR = path.join(__dirname, '..', 'api_dumps');

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Fetch all properties with ALL possible includes
  console.log('\n📡 Fetching all properties with full includes...');
  const listRes = await fetchGlobalData('/properties?include=photos,amenities,addresses,fees,taxes,discounts');
  const properties = listRes.data.data || listRes.data;
  const globalIncluded = listRes.data.included || [];
  console.log(`✅ Found ${properties.length} properties\n`);

  // Save the raw list response
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '_all_properties_list.json'),
    JSON.stringify(listRes.data, null, 2)
  );
  console.log('📝 Saved _all_properties_list.json\n');

  // 2. For each property, fetch its individual detail + calendar + bookings
  for (const prop of properties) {
    const id = prop.id;
    const name = (prop.attributes?.name || prop.attributes?.nickname || id).replace(/[^a-zA-Z0-9_-]/g, '_');
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🏠 Property: ${prop.attributes?.name || id} (ID: ${id})`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const output = {
      _meta: {
        propertyId: id,
        propertyName: prop.attributes?.name || 'Unknown',
        fetchedAt: new Date().toISOString()
      },
      propertyDetail: null,
      includedResources: null,
      calendar: null,
      bookings: null
    };

    // 2a. Fetch single property with all includes
    try {
      console.log(`  📡 Fetching detail...`);
      const detailRes = await fetchPropertyData(id, `/properties/${id}?include=photos,amenities,addresses,fees,taxes,discounts`);
      output.propertyDetail = detailRes.data.data || detailRes.data;
      output.includedResources = detailRes.data.included || [];
      console.log(`  ✅ Detail fetched (${(output.includedResources).length} included resources)`);
    } catch (e) {
      console.error(`  ❌ Detail fetch failed: ${e.message}`);
      output.propertyDetail = { error: e.message };
    }

    // 2b. Fetch calendar
    try {
      console.log(`  📡 Fetching calendar...`);
      const calRes = await fetchPropertyData(id, `/calendar/${id}`);
      output.calendar = calRes.data.calendar || calRes.data;
      const days = output.calendar?.days || [];
      console.log(`  ✅ Calendar fetched (${days.length} days)`);
    } catch (e) {
      console.error(`  ❌ Calendar fetch failed: ${e.message}`);
      output.calendar = { error: e.message };
    }

    // 2c. Fetch bookings
    try {
      console.log(`  📡 Fetching bookings...`);
      const bookRes = await fetchPropertyData(id, `/bookings/${id}`);
      output.bookings = bookRes.data.data || bookRes.data;
      const count = Array.isArray(output.bookings) ? output.bookings.length : '?';
      console.log(`  ✅ Bookings fetched (${count} bookings)`);
    } catch (e) {
      console.error(`  ❌ Bookings fetch failed: ${e.message}`);
      output.bookings = { error: e.message };
    }

    // 3. Write the file
    const filename = `property_${id}_${name}.json`;
    fs.writeFileSync(
      path.join(OUTPUT_DIR, filename),
      JSON.stringify(output, null, 2)
    );
    console.log(`  📝 Saved ${filename}`);
  }

  console.log(`\n🏁 Done! All files saved to: ${OUTPUT_DIR}\n`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
