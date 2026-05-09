/**
 * Force-cancel Uplisting booking 10784592 via the V2 API.
 * Run with:  node force_cancel_uplisting.js
 */
require('dotenv').config();
const { cancelV2Booking } = require('./services/uplistingService');

const BOOKING_ID = '10784592';

(async () => {
  console.log(`[ForceCancellation] Cancelling Uplisting booking ${BOOKING_ID}...`);
  try {
    const result = await cancelV2Booking(BOOKING_ID);
    console.log('[ForceCancellation] ✅ Success:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('[ForceCancellation] ❌ Failed:', err.response?.status, JSON.stringify(err.response?.data || err.message, null, 2));
    process.exit(1);
  }
})();
