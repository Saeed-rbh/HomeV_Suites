require('dotenv').config();
const { createV2Booking } = require('./services/uplistingService');

async function test() {
  try {
    console.log("Testing Uplisting V2 with experimental field names...");
    const result = await createV2Booking({
      propertyId: "254188",
      checkIn: "2026-12-01",
      checkOut: "2026-12-03",
      guestName: "Field Test",
      guestEmail: "field@test.com",
      guestPhone: "+15550001111",
      numberOfGuests: 1
    });
    console.log("Accepted Attributes in Response:", JSON.stringify(result.data.attributes, null, 2));
  } catch (e) {
    console.error("Test failed");
  }
}
test();
