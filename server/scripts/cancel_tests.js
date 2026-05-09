require('dotenv').config();
const { updateV2Booking } = require('./services/uplistingService');

const ids = ['10758440', '10758483'];

async function cancelAll() {
  for (const id of ids) {
    try {
      console.log(`Cancelling test booking ${id}...`);
      await updateV2Booking(id, { status: 'cancelled' });
      console.log(`✅ Cancelled ${id}`);
    } catch (e) {
      console.error(`❌ Failed to cancel ${id}`);
    }
  }
}

cancelAll();
