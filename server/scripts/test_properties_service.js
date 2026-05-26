require('dotenv').config();
const { getProperties } = require('../services/propertyService');

async function testService() {
  try {
    const props = await getProperties({});
    console.log('Returned properties:', props.length);
    if (props.length > 0) {
      props.forEach(p => {
        console.log(`[${p.id}] ${p.title}`);
        console.log(`  blockedDates type: ${typeof p.blockedDates}, isArray: ${Array.isArray(p.blockedDates)}`);
        console.log(`  blockedDates count: ${p.blockedDates?.length}`);
        console.log(`  blockedDates sample:`, p.blockedDates?.slice(0, 5));
      });
    }
  } catch (err) {
    console.error(err);
  }
}

testService();
