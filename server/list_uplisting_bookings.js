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

async function list() {
  try {
    console.log("Fetching recent bookings from Uplisting...");
    const res = await apiClient.get('/bookings?limit=20');
    const bookings = res.data.data || res.data;
    console.log(JSON.stringify(bookings, null, 2));
  } catch (e) {
    console.error("Failed to fetch bookings:", e.response?.data || e.message);
  }
}

list();
