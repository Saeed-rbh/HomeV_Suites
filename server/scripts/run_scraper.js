require('dotenv').config();
const { scrapeAndSyncProperties } = require('../services/scraperService');

scrapeAndSyncProperties()
  .then(count => {
    console.log(`\n✅ Done! Synced ${count} properties.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
  });
