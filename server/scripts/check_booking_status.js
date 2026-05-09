/**
 * Dump raw GET /bookings/254188 response to understand structure
 * and see the real current status of booking 10784592
 */
require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.UPLISTING_API_KEY;
const v1 = axios.create({
  baseURL: 'https://connect.uplisting.io',
  headers: {
    'Authorization': `Basic ${Buffer.from(API_KEY).toString('base64')}`,
    'Content-Type': 'application/json'
  }
});

(async () => {
  console.log('=== Raw GET /bookings/254188 (no date filter) ===');
  try {
    const r = await v1.get('/bookings/254188');
    // Show top-level keys
    console.log('Top-level keys:', Object.keys(r.data));
    // Find booking 10784592
    const findBooking = (obj) => {
      if (Array.isArray(obj)) return obj.find(b => String(b.id) === '10784592');
      if (obj && typeof obj === 'object') {
        for (const v of Object.values(obj)) {
          const found = findBooking(v);
          if (found) return found;
        }
      }
      return null;
    };
    const target = findBooking(r.data);
    if (target) {
      console.log('\n✅ Found booking 10784592:');
      console.log('  status:', target.status);
      console.log('  check_in:', target.check_in);
      console.log('  check_out:', target.check_out);
    } else {
      console.log('\n🔍 Booking 10784592 NOT found in response.');
      console.log('Total bookings returned:', JSON.stringify(r.data).length, 'chars');
    }
    // Also show last 3 bookings to confirm response shape
    const arr = Array.isArray(r.data) ? r.data
      : Array.isArray(r.data?.data) ? r.data.data
      : Array.isArray(r.data?.bookings) ? r.data.bookings
      : null;
    if (arr) {
      console.log('\nTotal bookings in response:', arr.length);
      arr.slice(-3).forEach(b => console.log(`  id=${b.id} status=${b.status} ${b.check_in}→${b.check_out}`));
    }
  } catch (e) {
    console.error('Error:', e.response?.status, JSON.stringify(e.response?.data || e.message).slice(0, 500));
  }
})();
