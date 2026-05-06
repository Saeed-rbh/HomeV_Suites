require('dotenv').config();
const { createCustomBookingAttribute } = require('./services/uplistingService');

async function run() {
  try {
    console.log("Registering homev_guest_email...");
    await createCustomBookingAttribute('homev_guest_email', 'The email address of the guest from the HomEV website.');
    console.log("Registering homev_guest_phone...");
    await createCustomBookingAttribute('homev_guest_phone', 'The phone number of the guest from the HomEV website.');
    console.log("Done!");
  } catch (e) {
    console.error("Failed to register attributes:", e.message);
  }
}
run();
