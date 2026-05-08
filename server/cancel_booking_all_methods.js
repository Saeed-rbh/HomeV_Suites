/**
 * Try every possible approach to cancel Uplisting booking 10784592 via V1 and V2.
 * Run: node cancel_booking_all_methods.js
 */
require('dotenv').config();
const axios = require('axios');

const API_KEY   = process.env.UPLISTING_API_KEY;
const CLIENT_ID = process.env.UPLISTING_CLIENT_ID;

const v1 = axios.create({
  baseURL: 'https://connect.uplisting.io',
  headers: {
    'Authorization': `Basic ${Buffer.from(API_KEY).toString('base64')}`,
    'Content-Type': 'application/json'
  }
});

const v2 = axios.create({
  baseURL: 'https://connect.uplisting.io',
  headers: {
    'Authorization': `Basic ${Buffer.from(API_KEY).toString('base64')}`,
    'Content-Type': 'application/json',
    'X-Uplisting-Client-Id': CLIENT_ID
  }
});

const BOOKING_ID = '10784592';

async function tryMethod(label, fn) {
  console.log(`\n=== ${label} ===`);
  try {
    const r = await fn();
    console.log(`✅ HTTP ${r.status}`, JSON.stringify(r.data || '').slice(0, 300));
  } catch (e) {
    console.error(`❌ HTTP ${e.response?.status}`, JSON.stringify(e.response?.data || e.message).slice(0, 300));
  }
}

(async () => {

  // Method 1: V1 DELETE /bookings/:id
  await tryMethod('V1 DELETE /bookings/:id', () =>
    v1.delete(`/bookings/${BOOKING_ID}`)
  );

  // Method 2: V1 PATCH /bookings/:id  { status: 'cancelled' }
  await tryMethod("V1 PATCH /bookings/:id { status: 'cancelled' }", () =>
    v1.patch(`/bookings/${BOOKING_ID}`, { status: 'cancelled' })
  );

  // Method 3: V1 PUT /bookings/:id  { status: 'cancelled' }
  await tryMethod("V1 PUT /bookings/:id { status: 'cancelled' }", () =>
    v1.put(`/bookings/${BOOKING_ID}`, { status: 'cancelled' })
  );

  // Method 4: V2 PATCH with JSON:API format  { data: { type, id, attributes: { status: 'cancelled' } } }
  await tryMethod("V2 PATCH /v2/bookings/:id JSON:API (already tried, re-checking)", () =>
    v2.patch(`/v2/bookings/${BOOKING_ID}`, {
      data: { type: 'bookings', id: String(BOOKING_ID), attributes: { status: 'cancelled' } }
    })
  );

  // Method 5: V2 DELETE /v2/bookings/:id
  await tryMethod('V2 DELETE /v2/bookings/:id', () =>
    v2.delete(`/v2/bookings/${BOOKING_ID}`)
  );

  // Method 6: V1 POST /bookings/:id/cancel  (some APIs use this pattern)
  await tryMethod('V1 POST /bookings/:id/cancel', () =>
    v1.post(`/bookings/${BOOKING_ID}/cancel`)
  );

  // Method 7: V2 POST /v2/bookings/:id/cancel
  await tryMethod('V2 POST /v2/bookings/:id/cancel', () =>
    v2.post(`/v2/bookings/${BOOKING_ID}/cancel`)
  );

  // ── After all attempts, re-read the V1 booking to see its current status ──
  console.log(`\n=== Final check: GET /bookings/254188 for booking ${BOOKING_ID} ===`);
  try {
    const r = await v1.get(`/bookings/254188`, {
      params: { start_date: '2026-10-28', end_date: '2026-11-07' }
    });
    const bookings = r.data?.data || r.data;
    const target = Array.isArray(bookings)
      ? bookings.find(b => String(b.id) === String(BOOKING_ID))
      : null;
    if (target) {
      console.log(`Booking ${BOOKING_ID} status: ${target.status}`);
      console.log('Full:', JSON.stringify(target, null, 2));
    } else {
      console.log('Booking not found in list (may have been deleted)');
      console.log('All IDs returned:', Array.isArray(bookings) ? bookings.map(b => b.id) : 'N/A');
    }
  } catch (e) {
    console.error('Final check error:', e.response?.status, e.message);
  }
})();
