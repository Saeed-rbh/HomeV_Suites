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

const ids = ['10758440', '10758483'];

async function deleteV2() {
  for (const id of ids) {
    try {
      console.log(`Attempting V2 DELETE for booking ${id}...`);
      const res = await apiClientV2.delete(`/v2/bookings/${id}`);
      console.log(`✅ Deleted ${id} — status: ${res.status}`);
    } catch (e) {
      console.error(`❌ Failed to delete ${id}:`, e.response?.data || e.message);
    }
  }
}

deleteV2();
