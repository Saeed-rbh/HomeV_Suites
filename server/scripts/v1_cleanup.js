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

const ids = ['10758440', '10758483', '10758515'];

async function cleanup() {
  for (const id of ids) {
    try {
      console.log(`V1 Update for booking ${id}...`);
      await apiClient.put(`/bookings/${id}`, {
        booking: {
          check_in: "2000-01-01",
          check_out: "2000-01-02",
          status: "cancelled"
        }
      });
      console.log(`✅ V1 Updated ${id}`);
    } catch (e) {
      console.error(`❌ V1 Failed ${id}:`, e.response?.data || e.message);
    }
  }
}

cleanup();
