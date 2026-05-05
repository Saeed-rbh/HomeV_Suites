const { fetchPropertyData } = require('../services/uplistingService');

async function main() {
  const response = await fetchPropertyData('254188', '/properties/254188');
  const d = response.data?.data || response.data;
  const attr = d?.attributes || d || {};
  console.log('ALL KEYS:', Object.keys(attr));
  console.log('FULL ATTR:', JSON.stringify(attr, null, 2).slice(0, 3000));
}

main().catch(console.error);
