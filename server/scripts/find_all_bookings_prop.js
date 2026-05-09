require('dotenv').config();
const axios = require('axios');
const API_KEY = process.env.UPLISTING_API_KEY;

const apiClient = axios.create({
  baseURL: 'https://connect.uplisting.io',
  headers: {
    'Authorization': `Basic ${Buffer.from(API_KEY).toString('base64')}`,
    'Content-Type': 'application/json'
  }
});

async function run() {
  const propId = "254188";
  try {
    console.log(`Fetching bookings for property ${propId}...`);
    // V1 endpoint for property bookings
    const res = await apiClient.get(`/bookings?property_id=${propId}&limit=100`);
    const bookings = res.data.data || res.data;
    console.log(JSON.stringify(bookings.map(b => ({ id: b.id, name: b.guest_name, start: b.check_in, end: b.check_out, status: b.status })), null, 2));
  } catch (e) {
    console.error("Failed to fetch bookings:", e.response?.data || e.message);
  }
}
run();
