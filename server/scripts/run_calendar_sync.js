require('dotenv').config();
const { syncHostawayCalendars } = require('../services/scraperService');

async function run() {
  console.log('[Script] Triggering manual calendar sync...');
  const success = await syncHostawayCalendars();
  console.log('[Script] Done. Success status:', success);
  process.exit(success ? 0 : 1);
}

run().catch(console.error);
