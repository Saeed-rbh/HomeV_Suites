require('dotenv').config();
const { createV2Booking, updateV2Booking } = require('./services/uplistingService');

async function sendTest() {
  try {
    console.log("🚀 Sending Final Sync Test...");
    
    // 1. Create the booking with standard fields + split names
    const result = await createV2Booking({
      propertyId: "254188",
      checkIn: "2026-11-20",
      checkOut: "2026-11-22",
      guestName: "HomEV Sync Test",
      guestEmail: "saeed.verify@example.com",
      guestPhone: "+14165550199",
      firstName: "HomEV",
      lastName: "Sync Test",
      numberOfGuests: 2
    });
    
    const bookingId = result.data.id;
    console.log(`✅ Booking created! ID: ${bookingId}`);
    
    // 2. Immediately patch with custom attributes for visibility
    console.log("🔄 Patching with custom attributes for dashboard visibility...");
    await updateV2Booking(bookingId, {
      homev_payment_source: 'stripe',
      homev_booking_origin: 'website',
      homev_guest_email: 'saeed.verify@example.com',
      homev_guest_phone: '+1 416-555-0199'
    });
    
    console.log("✨ Final test complete! Please check your Uplisting dashboard for 'HomEV Sync Test'.");
  } catch (e) {
    console.error("❌ Final test failed:", e.message);
  }
}

sendTest();
