require('dotenv').config();
const { createV2Booking } = require('./services/uplistingService');

async function test() {
  try {
    console.log("Testing Uplisting V2 with first_name and last_name...");
    // Manually calling apiClientV2 to test different attributes
    const { Pool, neonConfig } = require('@neondatabase/serverless');
    const axios = require('axios');
    const API_KEY = process.env.UPLISTING_API_KEY;
    const CLIENT_ID = process.env.UPLISTING_CLIENT_ID;
    const client = axios.create({
      baseURL: 'https://connect.uplisting.io',
      headers: {
        'Authorization': `Basic ${Buffer.from(API_KEY).toString('base64')}`,
        'X-Uplisting-Client-Id': CLIENT_ID,
        'Content-Type': 'application/json'
      }
    });

    const body = {
      data: {
        attributes: {
          check_in: "2026-01-01",
          check_out: "2026-01-03",
          first_name: "John",
          last_name: "Doe",
          email: "john@doe.com",
          phone: "+15559990000"
        },
        relationships: {
          property: { data: { type: 'properties', id: "254188" } }
        }
      }
    };

    const result = await client.post('/v2/bookings', body);
    console.log("Accepted Attributes:", JSON.stringify(result.data.data.attributes, null, 2));
  } catch (e) {
    console.error("Test failed:", e.response?.data || e.message);
  }
}
test();
