/**
 * Diagnose Uplisting booking 10784592 — fetch its current state and the
 * property calendar to see why the block is still showing.
 * Run: node diagnose_booking.js
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

const BOOKING_ID = '10784592';

(async () => {
  // 1. Fetch the V2 booking record
  console.log(`\n=== Fetching V2 booking ${BOOKING_ID} ===`);
  try {
    const res = await v2.get(`/v2/bookings/${BOOKING_ID}`);
    const b = res.data?.data;
    console.log('Booking ID:      ', b?.id);
    console.log('Status:          ', b?.attributes?.status);
    console.log('Check-in:        ', b?.attributes?.check_in);
    console.log('Check-out:       ', b?.attributes?.check_out);
    console.log('Property ID:     ', b?.relationships?.property?.data?.id);
    console.log('Full attributes: ', JSON.stringify(b?.attributes, null, 2));

    const propId = b?.relationships?.property?.data?.id;
    const checkIn = b?.attributes?.check_in;
    const checkOut = b?.attributes?.check_out;

    if (propId && checkIn && checkOut) {
      // 2. Check the calendar for those specific dates
      console.log(`\n=== Checking calendar for property ${propId} (${checkIn} → ${checkOut}) ===`);
      try {
        const calRes = await v1.get(`/calendar/${propId}`, {
          params: { start_date: checkIn, end_date: checkOut }
        });
        const days = calRes.data?.calendar?.days || calRes.data?.data || calRes.data;
        console.log('Calendar days:', JSON.stringify(days, null, 2));
      } catch (calErr) {
        console.error('Calendar fetch error:', calErr.response?.status, JSON.stringify(calErr.response?.data || calErr.message));
      }

      // 3. Try fetching all bookings for the property to see if there's a duplicate block
      console.log(`\n=== All bookings for property ${propId} ===`);
      try {
        const booksRes = await v1.get(`/bookings`, { params: { property_id: propId } });
        const bookings = booksRes.data?.data || booksRes.data;
        if (Array.isArray(bookings)) {
          bookings.forEach(bk => {
            console.log(`  ID=${bk.id} | status=${bk.attributes?.status} | ${bk.attributes?.check_in} → ${bk.attributes?.check_out} | source=${bk.attributes?.source || bk.attributes?.booking_source}`);
          });
        } else {
          console.log('Raw:', JSON.stringify(bookings, null, 2));
        }
      } catch (bErr) {
        console.error('Bookings list error:', bErr.response?.status, JSON.stringify(bErr.response?.data || bErr.message));
      }
    }
  } catch (err) {
    console.error('V2 booking fetch error:', err.response?.status, JSON.stringify(err.response?.data || err.message));
  }
})();
