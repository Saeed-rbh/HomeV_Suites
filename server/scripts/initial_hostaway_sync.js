const prisma = require('../db');
const { scrapeAndSyncProperties } = require('../services/scraperService');

// This deployment is authorized for one import attempt. A unique database row
// claims that attempt BEFORE any Hostaway requests, including across restarts
// and overlapping deployments. Failed/interrupted attempts are never retried
// automatically; a further attempt requires an explicit operator decision.
const RUN_KEY = 'deployment:hostaway-import:2026-10-22';

async function runInitialSync(db = prisma, sync = scrapeAndSyncProperties) {
  try {
    await db.siteSetting.create({
      data: { key: RUN_KEY, value: JSON.stringify({ status: 'started' }) }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('[InitialHostawaySync] Import already attempted; skipping.');
      return;
    }
    throw error;
  }

  try {
    const count = await sync();
    const status = count > 0 ? 'completed' : 'no-properties-imported';
    await db.siteSetting.update({
      where: { key: RUN_KEY },
      data: { value: JSON.stringify({ status, count }) }
    });
    console.log(`[InitialHostawaySync] ${status}: ${count} properties.`);
  } catch (error) {
    await db.siteSetting.update({
      where: { key: RUN_KEY },
      data: { value: JSON.stringify({ status: 'failed' }) }
    });
    throw error;
  }
}

if (require.main === module) {
  runInitialSync()
    .catch(error => {
      console.error('[InitialHostawaySync] Failed:', error.message);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { runInitialSync };
