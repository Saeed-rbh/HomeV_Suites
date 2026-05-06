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

async function unblock() {
  const propertyId = "254188";
  const days = [
    { date: "2026-11-01", available: true },
    { date: "2026-11-02", available: true }
  ];

  try {
    console.log(`Unblocking dates for property ${propertyId}...`);
    const res = await apiClient.post(`/calendar/${propertyId}`, {
      calendar: { days }
    });
    console.log(`✅ Dates unblocked — status: ${res.status}`);
  } catch (e) {
    console.error(`❌ Failed to unblock dates:`, e.response?.data || e.message);
  }
}

unblock();
