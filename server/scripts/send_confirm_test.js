require('dotenv').config();
const { createV2Booking, updateV2Booking } = require('./services/uplistingService');

async function sendTest() {
  try {
    console.log("🚀 Sending Visibility Confirmation Test (Nov 1-3)...");
    
    const result = await createV2Booking({
      propertyId: "254188",
      checkIn: "2026-11-01",
      checkOut: "2026-11-03",
      guestName: "Visibility Confirm Test",
      guestEmail: "confirm@homevsuites.com",
      guestPhone: "+14160000000",
      firstName: "Visibility",
      lastName: "Confirm Test",
      numberOfGuests: 1
    });
    
    const bookingId = result.data.id;
    console.log(`✅ Booking created! ID: ${bookingId}`);
    
    console.log("🔄 Patching with custom contact attributes...");
    await updateV2Booking(bookingId, {
      homev_payment_source: 'stripe',
      homev_booking_origin: 'website',
      homev_guest_email: 'confirm@homevsuites.com',
      homev_guest_phone: '+1 416-000-0000'
    });
    
    console.log("✨ Test complete! Please check Uplisting for 'Visibility Confirm Test'.");
  } catch (e) {
    console.error("❌ Test failed:", e.response?.data || e.message);
  }
}

sendTest();
