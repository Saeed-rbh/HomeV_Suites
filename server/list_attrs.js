require('dotenv').config();
const { listCustomBookingAttributes } = require('./services/uplistingService');

async function run() {
  try {
    const res = await listCustomBookingAttributes();
    console.log("Custom Attributes:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("Failed to list attributes");
  }
}
run();
