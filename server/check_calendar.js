require('dotenv').config();
const { fetchPropertyData } = require('./services/uplistingService');

async function run() {
  try {
    const propId = "254188";
    const res = await fetchPropertyData(propId, `/calendar/${propId}`, { 
      from: "2026-11-01", 
      to: "2026-11-30" 
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error("Failed to fetch calendar");
  }
}
run();
