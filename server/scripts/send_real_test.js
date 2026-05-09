require('dotenv').config();
const { createV2Booking, updateV2Booking } = require('./services/uplistingService');

async function sendTest() {
  try {
    console.log("🚀 Sending Real Contact Sync Test (Nov 5-7)...");
    
    const result = await createV2Booking({
      propertyId: "254188",
      checkIn: "2026-11-05",
      checkOut: "2026-11-07",
      guestName: "Saeed Arabha",
      guestEmail: "saeedarabha@outlook.com",
      guestPhone: "+14168365851",
      firstName: "Saeed",
      lastName: "Arabha",
      numberOfGuests: 1
    });
    
    const bookingId = result.data.id;
    console.log(`✅ Booking created! ID: ${bookingId}`);
    
    console.log("🔄 Patching with custom contact attributes...");
    await updateV2Booking(bookingId, {
      homev_payment_source: 'stripe',
      homev_booking_origin: 'website',
      homev_guest_email: 'saeedarabha@outlook.com',
      homev_guest_phone: '+14168365851'
    });
    
    console.log("✨ Test complete! Please check Uplisting for 'Saeed Arabha'.");
  } catch (e) {
    console.error("❌ Test failed:", e.response?.data || e.message);
  }
}

sendTest();
