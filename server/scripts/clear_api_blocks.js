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

async function clearBlocks() {
  const propId = "254188";
  // Clear a generous range around the test dates
  const days = [];
  const start = new Date("2026-10-25");
  const end = new Date("2026-11-30");
  let current = new Date(start);
  while (current <= end) {
    days.push({ date: current.toISOString().split('T')[0], available: true, note: "" });
    current.setDate(current.getDate() + 1);
  }

  try {
    console.log(`Clearing API blocks for property ${propId}...`);
    const res = await apiClient.post(`/calendar/${propId}`, {
      calendar: { days }
    });
    console.log(`✅ Blocks cleared — status: ${res.status}`);
  } catch (e) {
    console.error(`❌ Failed to clear blocks:`, e.response?.data || e.message);
  }
}

clearBlocks();
