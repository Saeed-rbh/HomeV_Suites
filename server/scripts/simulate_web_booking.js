require('dotenv').config();
const { createV2Booking } = require('./services/uplistingService');

async function simulate() {
  // Simulate the exact parameters the controller sends
  const params = {
    propertyId: "254188",
    checkIn: "2026-11-10",
    checkOut: "2026-11-12",
    guestName: "Web Simulation Test",
    guestEmail: "web.test@example.com",
    guestPhone: "+14165550000",
    firstName: "Web",
    lastName: "Simulation",
    numberOfGuests: 2
  };

  try {
    console.log("🚀 Simulating website-style V2 booking push...");
    const res = await createV2Booking(params);
    console.log("✅ Success! ID:", res.data.id);
  } catch (e) {
    console.error("❌ FAILED:", e.response?.data || e.message);
  }
}

simulate();
