/**
 * HomEV — Uplisting Booking Integration Test
 * ============================================
 * Tests whether a website booking correctly flows to Uplisting
 * to block calendar dates and prevent double-reservations.
 *
 * What it checks:
 *   1. Server is alive
 *   2. Uplisting API key is valid
 *   3. Fetches a real property ID from Uplisting
 *   4. Reads the calendar BEFORE booking (should be open)
 *   5. Creates a booking via the HomEV website API
 *   6. Reads the calendar AFTER booking  ← KEY TEST (must be blocked)
 *   7. Checks if booking appears in Uplisting's booking list
 *   8. Cleans up the test reservation from local DB
 *
 * Usage:  node test_uplisting_booking_flow.js
 * Prereq: server must be running on localhost:5000
 *         (cd server && npm run dev)
 */

require('dotenv').config();
const axios = require('axios');

// Use the same internal service so auth headers match exactly
const { fetchGlobalData, fetchPropertyData } = require('./services/uplistingService');

// ─── Config ──────────────────────────────────────────────────────────────────
const SERVER_URL = 'http://localhost:5000';

// ─── Terminal colours ─────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

let passed = 0, failed = 0, warnings = 0;

const ok   = (label, msg) => { console.log(`${GREEN}${BOLD}✅ [${label}]${RESET}${GREEN} ${msg}${RESET}`); passed++;   };
const fail = (label, msg) => { console.log(`${RED}${BOLD}❌ [${label}]${RESET}${RED} ${msg}${RESET}`);   failed++;   };
const warn = (label, msg) => { console.log(`${YELLOW}${BOLD}⚠️  [${label}]${RESET}${YELLOW} ${msg}${RESET}`); warnings++; };
const info = (label, msg) => { console.log(`${CYAN}${BOLD}ℹ️  [${label}]${RESET}${CYAN} ${msg}${RESET}`); };
const hr   = ()            =>   console.log(`${CYAN}${'─'.repeat(62)}${RESET}`);

// ─── Date helpers ─────────────────────────────────────────────────────────────
function dateRange(checkIn, checkOut) {
  const dates = [];
  const d = new Date(checkIn + 'T00:00:00Z');
  const end = new Date(checkOut + 'T00:00:00Z');
  while (d < end) { dates.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
  return dates;
}

/** Use dates ~60 days out so we never interfere with real near-term bookings */
function getFutureDates(nights = 2) {
  const ci = new Date(); ci.setUTCDate(ci.getUTCDate() + 60);
  const co = new Date(ci); co.setUTCDate(co.getUTCDate() + nights);
  return { checkIn: ci.toISOString().slice(0, 10), checkOut: co.toISOString().slice(0, 10) };
}

// ─── Test 1: Server health ────────────────────────────────────────────────────
async function test1_serverHealth() {
  hr(); info('TEST 1', 'Server health check');
  try {
    const r = await axios.get(`${SERVER_URL}/api/health`, { timeout: 5000 });
    if (r.data?.status === 'ok') { ok('Server', 'Backend is running on port 5000'); return true; }
    fail('Server', `Unexpected health response: ${JSON.stringify(r.data)}`);
  } catch (e) {
    fail('Server', `Cannot reach backend — is it running? (${e.message})`);
    console.log(`${YELLOW}  ➜ Start with: cd server && npm run dev${RESET}`);
  }
  return false;
}

// ─── Test 2: Uplisting API key ────────────────────────────────────────────────
async function test2_uplistingApiKey() {
  hr(); info('TEST 2', 'Uplisting API key validity');
  try {
    const r = await fetchGlobalData('/users/me');
    const attr = r.data?.data?.attributes || {};
    ok('Uplisting Key', `Valid ✔ — account: ${attr.email || attr.first_name || '(unknown)'}`);
    return true;
  } catch (e) {
    fail('Uplisting Key', `API key rejected: HTTP ${e.response?.status || 'N/A'} — ${e.message}`);
    return false;
  }
}

// ─── Test 3: Fetch a real property ID ────────────────────────────────────────
async function test3_fetchFirstProperty() {
  hr(); info('TEST 3', 'Fetching Uplisting properties');
  try {
    const r = await fetchGlobalData('/properties');
    const props = r.data?.data || [];
    if (!props.length) { fail('Properties', 'No properties in Uplisting account'); return null; }
    const p = props[0];
    ok('Properties', `${props.length} propert${props.length > 1 ? 'ies' : 'y'} found. Using: "${p.attributes?.name || p.id}" (ID: ${p.id})`);
    return p.id;
  } catch (e) {
    fail('Properties', `Failed: ${e.message}`);
    return null;
  }
}

// ─── Test 4: Calendar BEFORE booking ─────────────────────────────────────────
async function test4_calendarBefore(propertyId, checkIn, checkOut) {
  hr(); info('TEST 4', `Uplisting calendar BEFORE booking  (${checkIn} → ${checkOut})`);
  try {
    const r = await fetchPropertyData(propertyId, `/calendar/${propertyId}`, { start_date: checkIn, end_date: checkOut });
    const days = r.data?.calendar?.days || r.data?.days || [];
    const targets = dateRange(checkIn, checkOut);
    const map = {};
    days.forEach(d => { if (targets.includes(d.date)) map[d.date] = d.available; });

    const allOpen = targets.every(d => map[d] !== false);
    if (allOpen) ok('Calendar Pre', `All ${targets.length} dates AVAILABLE — safe to run test`);
    else warn('Calendar Pre', `Some dates already blocked: ${targets.filter(d => map[d] === false).join(', ')}`);
    return map;
  } catch (e) {
    warn('Calendar Pre', `Could not read calendar: ${e.response?.status || ''} ${e.message}`);
    return {};
  }
}

// ─── Test 5: Create booking via website API ───────────────────────────────────
async function test5_createWebsiteBooking(propertyId, checkIn, checkOut) {
  hr(); info('TEST 5', 'Creating booking via HomEV website API  POST /api/reservations');
  const payload = {
    propertyId,
    checkInDate:     checkIn,    // Controller maps → startDate
    checkOutDate:    checkOut,   // Controller maps → endDate
    adults:          2,
    children:        0,
    totalPrice:      500.00,
    currency:        'CAD',
    status:          'PENDING',
    selectedNonRefundable: false,
    name:            'Test Guest (Auto)',
    email:           'autotest@homevsuites.com',
    phone:           '+14165550199',
    specialRequests: '[AUTOMATED TEST] Safe to delete — do not process'
  };
  try {
    const r = await axios.post(`${SERVER_URL}/api/reservations`, payload, { timeout: 15000 });
    if (r.data?.success && r.data?.data?.id) {
      ok('Create Booking', `Local reservation created — ID: ${r.data.data.id}`);
      return r.data.data;
    }
    fail('Create Booking', `Unexpected response: ${JSON.stringify(r.data)}`);
  } catch (e) {
    fail('Create Booking', `POST failed: HTTP ${e.response?.status} — ${JSON.stringify(e.response?.data || e.message)}`);
  }
  return null;
}

// ─── Test 6: Calendar AFTER booking — THE KEY TEST ───────────────────────────
async function test6_calendarAfter(propertyId, checkIn, checkOut) {
  hr(); info('TEST 6', `Uplisting calendar AFTER booking — DOUBLE-BOOKING PREVENTION CHECK`);
  info('TEST 6', 'Waiting 8 s for Uplisting async calendar sync...');
  await new Promise(r => setTimeout(r, 8000));

  try {
    const r = await fetchPropertyData(propertyId, `/calendar/${propertyId}`, { start_date: checkIn, end_date: checkOut });
    const days = r.data?.calendar?.days || r.data?.days || [];
    const targets = dateRange(checkIn, checkOut);
    const map = {};
    days.forEach(d => { if (targets.includes(d.date)) map[d.date] = d.available; });

    const blocked = targets.filter(d => map[d] === false);
    const still_open = targets.filter(d => map[d] !== false);

    if (blocked.length === targets.length) {
      ok('Calendar Post', `ALL ${targets.length} dates BLOCKED in Uplisting ✔ — double-booking is impossible`);
    } else if (blocked.length > 0) {
      warn('Calendar Post', `Only ${blocked.length}/${targets.length} dates blocked. Open: ${still_open.join(', ')}`);
    } else {
      fail('Calendar Post',
        `NONE of the ${targets.length} dates are blocked in Uplisting!\n` +
        `${RED}       ➜ Another guest CAN book the same dates on Airbnb/VRBO/etc.\n` +
        `       ➜ Date availability map: ${JSON.stringify(map)}${RESET}`
      );
    }
    return { blocked, still_open };
  } catch (e) {
    fail('Calendar Post', `Could not read calendar: ${e.response?.status || ''} ${e.message}`);
    return { blocked: [], still_open: [] };
  }
}

// ─── Test 7: Booking visible in Uplisting ─────────────────────────────────────
async function test7_uplistingBookingList(propertyId, checkIn, checkOut) {
  hr(); info('TEST 7', 'Checking Uplisting /bookings for the test reservation');
  try {
    const r = await fetchPropertyData(propertyId, `/bookings/${propertyId}`, { start_date: checkIn, end_date: checkOut });
    const bookings = r.data?.data || [];
    const hit = bookings.find(b => {
      const a = b.attributes || {};
      return a.guest_email === 'autotest@homevsuites.com' ||
             (a.check_in === checkIn && a.check_out === checkOut);
    });

    if (hit) {
      ok('Uplisting Bookings', `Test booking IS in Uplisting — status: "${hit.attributes?.status}", channel: "${hit.attributes?.channel}"`);
    } else {
      fail('Uplisting Bookings',
        `Test booking NOT found in Uplisting.\n` +
        `       ➜ The website booking does NOT create a record in Uplisting.\n` +
        `       ➜ Bookings found for this period: ${bookings.length}`
      );
    }
    return hit;
  } catch (e) {
    warn('Uplisting Bookings', `Could not query bookings: ${e.response?.status || ''} ${e.message}`);
    return null;
  }
}

// ─── Test 8: Cleanup ──────────────────────────────────────────────────────────
async function test8_cleanup(reservationId) {
  hr(); info('TEST 8', `Cleanup — deleting test reservation ${reservationId}`);
  try {
    const r = await axios.delete(`${SERVER_URL}/api/reservations/${reservationId}`, { timeout: 10000 });
    if (r.data?.success) ok('Cleanup', 'Test reservation removed from local DB');
    else warn('Cleanup', `Unexpected: ${JSON.stringify(r.data)}`);
  } catch (e) {
    warn('Cleanup', `Delete failed — remove manually. Error: ${e.response?.status} ${e.message}`);
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
function printSummary(propertyId, checkIn, checkOut, reservation, calAfter) {
  console.log(`\n${CYAN}${'═'.repeat(62)}${RESET}`);
  console.log(`${BOLD}  📊  TEST SUMMARY${RESET}`);
  console.log(`${CYAN}${'═'.repeat(62)}${RESET}`);
  console.log(`  Property     : ${propertyId}`);
  console.log(`  Dates        : ${checkIn}  →  ${checkOut}`);
  console.log(`  Reservation  : ${reservation?.id || 'N/A'}`);
  console.log(`  Blocked      : ${calAfter?.blocked?.join(', ') || 'none'}`);
  console.log(`  Still open   : ${calAfter?.still_open?.join(', ') || 'none'}`);
  console.log(`${CYAN}${'─'.repeat(62)}${RESET}`);
  console.log(`  ${GREEN}${BOLD}Passed  : ${passed}${RESET}`);
  console.log(`  ${RED}${BOLD}Failed  : ${failed}${RESET}`);
  console.log(`  ${YELLOW}${BOLD}Warnings: ${warnings}${RESET}`);
  console.log(`${CYAN}${'═'.repeat(62)}${RESET}`);

  if (failed === 0 && warnings === 0) {
    console.log(`\n${GREEN}${BOLD}🎉  ALL TESTS PASSED — Bookings sync to Uplisting correctly!${RESET}\n`);
  } else if (failed > 0) {
    console.log(`\n${RED}${BOLD}🚨  BOOKING DOES NOT SYNC TO UPLISTING${RESET}`);
    console.log(`${RED}   Double-booking IS possible across channels (Airbnb, VRBO…)${RESET}`);
    console.log(`\n${YELLOW}${BOLD}   ROOT CAUSE:${RESET}`);
    console.log(`${YELLOW}   reservationController.js::createReservation() creates the booking`);
    console.log(`   only in the LOCAL DATABASE — it never pushes to Uplisting's API.${RESET}`);
    console.log(`\n${YELLOW}${BOLD}   WHAT NEEDS TO BE ADDED:${RESET}`);
    console.log(`${YELLOW}   After step 3 in createReservation(), call:`);
    console.log(`   uplistingService.blockCalendarDates(externalPropertyId, checkIn, checkOut)`);
    console.log(`   ➜ This POSTs to /calendar/:id with { available: false } for each date${RESET}\n`);
  } else {
    console.log(`\n${YELLOW}${BOLD}⚠   PASSED WITH WARNINGS — review above${RESET}\n`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${CYAN}${BOLD}${'═'.repeat(62)}`);
  console.log('  HomEV × Uplisting — Booking Integration Test Suite');
  console.log(`${'═'.repeat(62)}${RESET}`);
  console.log(`  Backend  : ${SERVER_URL}`);
  console.log(`  API Key  : ${(process.env.UPLISTING_API_KEY || '').slice(0, 8)}...`);
  console.log(`${CYAN}${'═'.repeat(62)}${RESET}\n`);

  if (!await test1_serverHealth()) { printSummary('N/A','N/A','N/A',null,null); process.exit(1); }
  if (!await test2_uplistingApiKey()) { printSummary('N/A','N/A','N/A',null,null); process.exit(1); }

  const propertyId = await test3_fetchFirstProperty();
  if (!propertyId) { printSummary('N/A','N/A','N/A',null,null); process.exit(1); }

  const { checkIn, checkOut } = getFutureDates(2);

  await test4_calendarBefore(propertyId, checkIn, checkOut);

  const reservation = await test5_createWebsiteBooking(propertyId, checkIn, checkOut);

  const calAfter = reservation
    ? await test6_calendarAfter(propertyId, checkIn, checkOut)
    : { blocked: [], still_open: [] };

  if (reservation) await test7_uplistingBookingList(propertyId, checkIn, checkOut);
  if (reservation?.id) await test8_cleanup(reservation.id);

  printSummary(propertyId, checkIn, checkOut, reservation, calAfter);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(`\n${RED}${BOLD}FATAL:${RESET}`, err.message, err.stack);
  process.exit(1);
});
