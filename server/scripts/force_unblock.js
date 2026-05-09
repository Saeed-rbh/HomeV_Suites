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
  const days = [];
  const start = new Date("2026-10-30");
  const end = new Date("2026-11-10");
  let current = new Date(start);
  while (current <= end) {
    days.push({ date: current.toISOString().split('T')[0], available: true });
    current.setDate(current.getDate() + 1);
  }

  try {
    console.log(`Force unblocking range for property ${propId}...`);
    const res = await apiClient.post(`/calendar/${propId}`, {
      calendar: { days }
    });
    console.log(`✅ Status: ${res.status}`);
  } catch (e) {
    console.error("Failed:", e.response?.data || e.message);
  }
}
run();
