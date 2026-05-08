/**
 * 1) Read the Nov 1-2 calendar to see if they're still blocked
 * 2) Try BOTH body formats to guarantee the unblock goes through
 * Run: node fix_calendar_v2.js
 */
require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.UPLISTING_API_KEY;
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

const PROP_ID   = '254188';
const CHECK_IN  = '2026-11-01';
const CHECK_OUT = '2026-11-03';  // exclusive, so Nov 1 & 2

// Build the day list
const days = [];
const d   = new Date(CHECK_IN  + 'T00:00:00Z');
const end = new Date(CHECK_OUT + 'T00:00:00Z');
while (d < end) {
  days.push({ date: d.toISOString().slice(0, 10), available: true, note: '' });
  d.setUTCDate(d.getUTCDate() + 1);
}
console.log('Dates to unblock:', days.map(x => x.date));

(async () => {

  // ── STEP 1: Read current calendar state ──────────────────────────────────
  console.log(`\n=== GET calendar ${PROP_ID} (${CHECK_IN} → ${CHECK_OUT}) ===`);
  try {
    const r = await v1.get(`/calendar/${PROP_ID}`, {
      params: { start_date: CHECK_IN, end_date: CHECK_OUT }
    });
    const calDays = r.data?.calendar?.days || r.data?.data || r.data;
    console.log('Current calendar state:', JSON.stringify(calDays, null, 2));
  } catch (e) {
    console.error('Calendar read error:', e.response?.status, JSON.stringify(e.response?.data || e.message));
  }

  // ── STEP 2: Try format A — { "dates": [...] }  (from API reference) ───────
  console.log('\n=== POST calendar unblock — Format A: { dates: [...] } ===');
  try {
    const r = await v1.post(`/calendar/${PROP_ID}`, { dates: days });
    console.log(`✅ Format A accepted — HTTP ${r.status}`, JSON.stringify(r.data || ''));
  } catch (e) {
    console.error(`❌ Format A failed — HTTP ${e.response?.status}`, JSON.stringify(e.response?.data || e.message));
  }

  // ── STEP 3: Try format B — { "calendar": { "days": [...] } } (current code) ─
  console.log('\n=== POST calendar unblock — Format B: { calendar: { days: [...] } } ===');
  try {
    const r = await v1.post(`/calendar/${PROP_ID}`, { calendar: { days } });
    console.log(`✅ Format B accepted — HTTP ${r.status}`, JSON.stringify(r.data || ''));
  } catch (e) {
    console.error(`❌ Format B failed — HTTP ${e.response?.status}`, JSON.stringify(e.response?.data || e.message));
  }

  // ── STEP 4: Read calendar again to confirm state after updates ───────────
  console.log(`\n=== GET calendar ${PROP_ID} AFTER unblock attempts ===`);
  try {
    const r = await v1.get(`/calendar/${PROP_ID}`, {
      params: { start_date: CHECK_IN, end_date: CHECK_OUT }
    });
    const calDays = r.data?.calendar?.days || r.data?.data || r.data;
    console.log('Calendar state AFTER:', JSON.stringify(calDays, null, 2));
  } catch (e) {
    console.error('Calendar read error:', e.response?.status, JSON.stringify(e.response?.data || e.message));
  }

  // ── STEP 5: List V1 bookings for this property to see the booking status ─
  console.log(`\n=== GET /bookings/${PROP_ID} (looking for booking 10784592) ===`);
  try {
    const r = await v1.get(`/bookings/${PROP_ID}`, {
      params: { start_date: '2026-10-28', end_date: '2026-11-07' }
    });
    const bookings = r.data?.data || r.data;
    if (Array.isArray(bookings)) {
      bookings.forEach(b => {
        console.log(`  id=${b.id} | status=${b.attributes?.status} | ${b.attributes?.check_in}→${b.attributes?.check_out} | channel=${b.attributes?.channel} | source=${b.attributes?.booking_source}`);
      });
    } else {
      console.log('Raw response:', JSON.stringify(bookings, null, 2));
    }
  } catch (e) {
    console.error('Bookings list error:', e.response?.status, JSON.stringify(e.response?.data || e.message));
  }

})();
