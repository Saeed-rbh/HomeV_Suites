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

const ids = ['10758440', '10758483'];

async function cleanup() {
  for (const id of ids) {
    try {
      console.log(`Deleting test booking ${id}...`);
      await apiClient.delete(`/bookings/${id}`);
      console.log(`✅ Deleted ${id}`);
    } catch (e) {
      console.error(`❌ Failed to delete ${id}:`, e.response?.data || e.message);
    }
  }
}

cleanup();
