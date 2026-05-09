/**
 * Testing the cancel method suggested by the user.
 * Method: POST
 * URL: https://api.uplisting.io/v2/bookings/${bookingId}/cancel
 * Headers: Authorization: Bearer/Basic, X-Client-Id/X-Uplisting-Client-Id
 */
require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.UPLISTING_API_KEY;
const CLIENT_ID = process.env.UPLISTING_CLIENT_ID;
const BOOKING_ID = '10784592';

async function tryCancel(baseUrl, authHeader, clientIdHeader) {
  const url = `${baseUrl}/v2/bookings/${BOOKING_ID}/cancel`;
  const headers = {
    'Content-Type': 'application/json',
    [authHeader.name]: authHeader.value,
    [clientIdHeader.name]: clientIdHeader.value
  };

  console.log(`\n--- Testing URL: ${url} ---`);
  console.log(`Headers: ${authHeader.name}: ${authHeader.value.substring(0, 15)}..., ${clientIdHeader.name}: ${clientIdHeader.value}`);

  try {
    const response = await axios({
      method: 'POST',
      url: url,
      headers: headers,
      data: {
        reason: "guest_request"
      }
    });
    console.log(`✅ Success! Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log(`❌ Failed. Status: ${error.response?.status || 'N/A'}`);
    if (error.response?.data) {
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error Message:', error.message);
    }
    return false;
  }
}

(async () => {
  if (!API_KEY || !CLIENT_ID) {
    console.error('Missing API_KEY or CLIENT_ID in environment');
    process.exit(1);
  }

  const basicAuth = `Basic ${Buffer.from(API_KEY).toString('base64')}`;
  const bearerAuth = `Bearer ${API_KEY}`; // Trying API_KEY as bearer token just in case

  const domains = ['https://api.uplisting.io', 'https://connect.uplisting.io'];
  
  // Try combinations
  for (const domain of domains) {
    // Try user's suggested headers: X-Client-Id
    await tryCancel(domain, { name: 'Authorization', value: bearerAuth }, { name: 'X-Client-Id', value: CLIENT_ID });
    await tryCancel(domain, { name: 'Authorization', value: basicAuth }, { name: 'X-Client-Id', value: CLIENT_ID });
    
    // Try existing headers: X-Uplisting-Client-Id
    await tryCancel(domain, { name: 'Authorization', value: bearerAuth }, { name: 'X-Uplisting-Client-Id', value: CLIENT_ID });
    await tryCancel(domain, { name: 'Authorization', value: basicAuth }, { name: 'X-Uplisting-Client-Id', value: CLIENT_ID });
  }
})();
