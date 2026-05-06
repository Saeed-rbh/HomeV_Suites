require('dotenv').config();
const { updateV2Booking } = require('./services/uplistingService');

const ids = ['10758440', '10758483', '10758515'];

async function hideAll() {
  for (const id of ids) {
    try {
      console.log(`Moving test booking ${id} to year 2000 to hide it from calendar...`);
      await updateV2Booking(id, { 
        check_in: "2000-01-01", 
        check_out: "2000-01-02",
        status: "cancelled" 
      });
      console.log(`✅ Hidden ${id}`);
    } catch (e) {
      console.error(`❌ Failed to hide ${id}`);
    }
  }
}

hideAll();
