require('dotenv').config();
const { createV2Booking } = require('./services/uplistingService');

async function test() {
  try {
    console.log("Testing Uplisting V2 Booking Creation...");
    const result = await createV2Booking({
      propertyId: "254188", // A real property ID from your account
      checkIn: "2026-11-01",
      checkOut: "2026-11-03",
      guestName: "Antigravity Test",
      guestEmail: "test@example.com",
      numberOfGuests: 2
    });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("Test failed!");
  }
}

test();
