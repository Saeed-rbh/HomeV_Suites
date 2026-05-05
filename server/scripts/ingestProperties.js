const { ingestPropertyFromUplisting } = require('../services/propertyService');
const p = require('../db');

async function main() {
  await ingestPropertyFromUplisting('254180');
  await ingestPropertyFromUplisting('254188');
  await ingestPropertyFromUplisting('254189');
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
