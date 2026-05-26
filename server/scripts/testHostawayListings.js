require('dotenv').config();
const axios = require('axios');

async function testListings() {
  const clientId = process.env.HOSTAWAY_CLIENT_ID;
  const apiKey = process.env.HOSTAWAY_API_KEY;
  
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', apiKey);
    params.append('scope', 'general');

    const authRes = await axios.post('https://api.hostaway.com/v1/accessTokens', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const accessToken = authRes.data.result?.accessToken || authRes.data.access_token;
    
    const listingsRes = await axios.get('https://api.hostaway.com/v1/listings', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache'
      }
    });
    
    const listings = listingsRes.data.result || [];
    if (listings.length > 0) {
      const first = listings[0];
      console.log("Images (first 2):", JSON.stringify(first.listingImages?.slice(0, 2), null, 2));
      console.log("\nAmenities (first 5):", JSON.stringify(first.listingAmenities?.slice(0, 5), null, 2));
      console.log("\nBed Types:", JSON.stringify(first.listingBedTypes, null, 2));
    }
  } catch (err) {
    console.error("Error fetching Hostaway listings:", err.message);
  }
}

testListings();
