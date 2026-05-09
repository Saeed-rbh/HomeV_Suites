require('dotenv').config();
const axios = require('axios');
const API_KEY = process.env.UPLISTING_API_KEY;
const CLIENT_ID = process.env.UPLISTING_CLIENT_ID;

const apiClientV2 = axios.create({
  baseURL: 'https://connect.uplisting.io',
  headers: {
    'Authorization': `Basic ${Buffer.from(API_KEY).toString('base64')}`,
    'X-Uplisting-Client-Id': CLIENT_ID,
    'Content-Type': 'application/json'
  }
});

async function run() {
  try {
    console.log("Searching for all bookings on property 254188...");
    // JSON:API filter for property ID
    const res = await apiClientV2.get('/v2/bookings?filter[property_id]=254188');
    const bookings = res.data.data;
    console.log(JSON.stringify(bookings.map(b => ({ 
      id: b.id, 
      name: b.attributes.guest_name, 
      start: b.attributes.check_in, 
      end: b.attributes.check_out, 
      status: b.attributes.status 
    })), null, 2));
  } catch (e) {
    console.error("Failed:", e.response?.data || e.message);
  }
}
run();
