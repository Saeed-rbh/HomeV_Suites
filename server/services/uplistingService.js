const axios = require('axios');
const Bottleneck = require('bottleneck');

// 1. Global Limiter: 100 requests per minute per IP, max 5 per second.
// minTime: 200 ensures max 5 requests per second.
// reservoir: 100 with a 60-second refresh guarantees max 100 per minute globally.
const globalLimiter = new Bottleneck({
  reservoir: 100,
  reservoirRefreshAmount: 100,
  reservoirRefreshInterval: 60000,
  maxConcurrent: 5,
  minTime: 200
});

// 2. Property Limiter Group: no more than 15 requests per min per property.
const propertyLimiters = new Bottleneck.Group({
  reservoir: 15,
  reservoirRefreshAmount: 15,
  reservoirRefreshInterval: 60000,
  maxConcurrent: 1, // Optional: restricts property queries from hitting at the exact same millisecond
  minTime: 200 // also honors the minimum pacing
});

// Chain the property limiter to the global limiter so both limits apply seamlessly.
propertyLimiters.on("created", (limiter, key) => {
  limiter.chain(globalLimiter);
});

const API_KEY = process.env.UPLISTING_API_KEY;
const CLIENT_ID = process.env.UPLISTING_CLIENT_ID;

console.log(`[Uplisting Config] API_KEY loaded: ${API_KEY ? '****' + API_KEY.slice(-4) : 'MISSING'}`);
console.log(`[Uplisting Config] CLIENT_ID loaded: ${CLIENT_ID ? '****' + CLIENT_ID.slice(-4) : 'MISSING'}`);

// Helper to get an authorized Axios client. 
// We use a getter to ensure environment variables are loaded and validated at call-time.
const getClient = (version = 'v1') => {
  if (!API_KEY) {
    throw new Error(`[Uplisting] ❌ API_KEY is missing from environment variables.`);
  }

  const headers = {
    'Authorization': `Basic ${Buffer.from(API_KEY).toString('base64')}`,
    'Content-Type': 'application/json'
  };

  if (version === 'v2') {
    if (!CLIENT_ID) {
      throw new Error(`[Uplisting] ❌ CLIENT_ID is missing from environment variables (Required for V2).`);
    }
    headers['X-Uplisting-Client-Id'] = CLIENT_ID;
  }

  return axios.create({
    baseURL: 'https://connect.uplisting.io',
    headers
  });
};

/**
 * POST property-specific data (e.g. calendar updates) through the property's queue
 */
const postPropertyData = async (propertyId, endpoint, body = {}) => {
  console.log(`[Uplisting API] 📡 POST ${endpoint} (property: ${propertyId})`);
  try {
    const result = await propertyLimiters.key(propertyId).schedule(() =>
      getClient().post(endpoint, body)
    );
    console.log(`[Uplisting API] ✅ POST ${endpoint} (property: ${propertyId}) — ${result.status}`);
    return result;
  } catch (error) {
    console.error(`[Uplisting API] ❌ POST ${endpoint} (property: ${propertyId}) FAILED`);
    console.error(`[Uplisting API] Status: ${error.response?.status || 'N/A'}`);
    console.error(`[Uplisting API] Response: ${JSON.stringify(error.response?.data || error.message)}`);
    throw error;
  }
};

/**
 * Block a date range on Uplisting's calendar for a given property.
 * This prevents double-bookings across all connected OTA channels
 * (Airbnb, VRBO, Booking.com, etc.) by marking dates as unavailable.
 *
 * @param {string} propertyId  - Uplisting external property ID
 * @param {string} checkIn     - YYYY-MM-DD check-in date (first night to block)
 * @param {string} checkOut    - YYYY-MM-DD check-out date (NOT blocked — guests leave this day)
 */
const blockCalendarDates = async (propertyId, checkIn, checkOut) => {
  // Build the list of night-dates to block (check-in inclusive, check-out exclusive)
  const dates = [];
  const d = new Date(checkIn + 'T00:00:00Z');
  const end = new Date(checkOut + 'T00:00:00Z');
  while (d < end) {
    dates.push({
      date: d.toISOString().slice(0, 10),
      available: false,
      note: 'Imported from website'
    });
    d.setUTCDate(d.getUTCDate() + 1);
  }

  if (dates.length === 0) {
    console.warn(`[Uplisting API] ⚠ blockCalendarDates: no dates to block for property ${propertyId}`);
    return;
  }

  console.log(`[Uplisting API] 🔒 Blocking ${dates.length} date(s) on property ${propertyId}: ${checkIn} → ${checkOut}`);
  return postPropertyData(propertyId, `/calendar/${propertyId}`, { calendar: { days: dates } });
};

/**
 * Unblock a date range on Uplisting's calendar for a given property.
 * This frees up the dates for new bookings across all connected OTA channels.
 *
 * @param {string} propertyId  - Uplisting external property ID
 * @param {string} checkIn     - YYYY-MM-DD check-in date
 * @param {string} checkOut    - YYYY-MM-DD check-out date
 */
const unblockCalendarDates = async (propertyId, checkIn, checkOut) => {
  const dates = [];
  const d = new Date(checkIn + 'T00:00:00Z');
  const end = new Date(checkOut + 'T00:00:00Z');
  while (d < end) {
    dates.push({
      date: d.toISOString().slice(0, 10),
      available: true,
      note: ''
    });
    d.setUTCDate(d.getUTCDate() + 1);
  }

  if (dates.length === 0) {
    return;
  }

  console.log(`[Uplisting API] 🔓 Unblocking ${dates.length} date(s) on property ${propertyId}: ${checkIn} → ${checkOut}`);
  return postPropertyData(propertyId, `/calendar/${propertyId}`, { calendar: { days: dates } });
};

// ─────────────────────────────────────────────────────────────
// V2 Partner Endpoints
// ─────────────────────────────────────────────────────────────

/**
 * Create a confirmed booking directly in Uplisting via the V2 API.
 * This is used for website bookings so they appear on the Uplisting
 * calendar and sync to all connected OTA channels.
 * Hi
 * @param {object} params
 * @param {string} params.propertyId    - Uplisting external property ID (required)
 * @param {string} params.checkIn       - ISO8601 date string, e.g. "2025-06-01" (required)
 * @param {string} params.checkOut      - ISO8601 date string, e.g. "2025-06-05" (required)
 * @param {string} [params.guestName]   - Guest full name
 * @param {string} [params.guestEmail]  - Guest email (required for automated messages)
 * @param {string} [params.guestPhone]  - Guest phone number
 * @param {number} [params.numberOfGuests] - Number of guests
 * @returns {Promise<object>} Uplisting API response
 */


const createV2Booking = async ({ propertyId, checkIn, checkOut, guestName, guestEmail, guestPhone, firstName, lastName, numberOfGuests } = {}) => {
  console.log(`[Uplisting V2] 📡 POST /v2/bookings — property: ${propertyId} | ${checkIn} → ${checkOut}`);

  if (!propertyId || !checkIn || !checkOut) {
    throw new Error('[Uplisting V2] createV2Booking requires propertyId, checkIn, and checkOut.');
  }

  // ⚠️ JSON:API format: property must be in `relationships`, NOT in `attributes`.
  const body = {
    data: {
      attributes: {
        check_in: checkIn,
        check_out: checkOut,
        ...(guestName && { guest_name: guestName }),
        ...(guestEmail && { guest_email: guestEmail }),
        ...(guestPhone && { guest_phone: guestPhone }),
        ...(firstName && { first_name: firstName }),
        ...(lastName && { last_name: lastName }),
        ...(numberOfGuests && { number_of_guests: numberOfGuests })
      },
      relationships: {
        property: {
          data: {
            type: 'properties',
            id: String(propertyId)
          }
        }
      }
    }
  };

  try {
    const result = await globalLimiter.schedule(() => getClient('v2').post('/v2/bookings', body));
    const uplistingBookingId = result.data?.data?.id;
    console.log(`[Uplisting V2] ✅ Booking created — status: ${result.status}${uplistingBookingId ? ` | uplisting_id: ${uplistingBookingId}` : ''}`);
    return result.data;
  } catch (error) {
    console.error('[Uplisting V2] ❌ POST /v2/bookings FAILED');
    console.error(`[Uplisting V2] Status: ${error.response?.status || 'N/A'}`);
    console.error(`[Uplisting V2] Full Error Body: ${JSON.stringify(error.response?.data || error.message)}`);
    console.error(`[Uplisting V2] Request Body Sent: ${JSON.stringify(body)}`);
    throw error;
  }
};

/**
 * Update an existing Uplisting booking (e.g. attach custom attribute values).
 * Uses PATCH /v2/bookings/:id with the JSON:API attribute format.
 *
 * @param {string|number} bookingId  - Uplisting booking ID (from createV2Booking response)
 * @param {object}        attributes - Key/value pairs to patch onto the booking
 * @returns {Promise<object>} Uplisting API response
 *
 * @example
 *   await updateV2Booking('165003', {
 *     homev_payment_source: 'stripe',
 *     homev_stripe_intent_id: 'pi_3abc...'
 *   });
 */
const updateV2Booking = async (bookingId, attributes = {}) => {
  console.log(`[Uplisting V2] 📡 PATCH /v2/bookings/${bookingId}`, attributes);

  if (!bookingId) {
    throw new Error('[Uplisting V2] updateV2Booking requires a bookingId.');
  }

  // JSON:API PATCH requires the id field inside data
  const body = {
    data: {
      type: 'bookings',
      id: String(bookingId),
      attributes
    }
  };

  try {
    const result = await globalLimiter.schedule(() => getClient('v2').patch(`/v2/bookings/${bookingId}`, body));
    console.log(`[Uplisting V2] ✅ Booking ${bookingId} updated — status: ${result.status}`);
    return result.data;
  } catch (error) {
    console.error(`[Uplisting V2] ❌ PATCH /v2/bookings/${bookingId} FAILED`);
    console.error(`[Uplisting V2] Status: ${error.response?.status || 'N/A'}`);
    console.error(`[Uplisting V2] Response: ${JSON.stringify(error.response?.data || error.message)}`);
    throw error;
  }
};

/**
 * Cancel a V2 booking in Uplisting by setting status to 'cancelled'.
 * Uses PATCH /v2/bookings/:id — DELETE returns 405 on the V2 endpoint.
 *
 * @param {string|number} bookingId - Uplisting V2 booking ID
 * @returns {Promise<object>} Uplisting API response
 */
const cancelV2Booking = async (bookingId) => {
  console.log(`[Uplisting V2] 📡 Cancelling booking ${bookingId} via PATCH /v2/bookings/${bookingId}`);

  if (!bookingId) {
    throw new Error('[Uplisting V2] cancelV2Booking requires a bookingId.');
  }

  const body = {
    data: {
      type: 'bookings',
      id: String(bookingId),
      attributes: { status: 'cancelled' }
    }
  };

  try {
    const result = await globalLimiter.schedule(() => getClient('v2').patch(`/v2/bookings/${bookingId}`, body));
    console.log(`[Uplisting V2] ✅ Booking ${bookingId} cancelled — HTTP ${result.status}`);
    return result.data;
  } catch (error) {
    console.error(`[Uplisting V2] ❌ Cancel booking ${bookingId} FAILED`);
    console.error(`[Uplisting V2] Status: ${error.response?.status || 'N/A'}`);
    console.error(`[Uplisting V2] Response: ${JSON.stringify(error.response?.data || error.message)}`);
    throw error;
  }
};

/**
 * List all custom booking attributes registered for this partner account.
 * GET /v2/custom_booking_attributes
 *
 * @returns {Promise<object[]>} Array of registered attribute definitions
 */
const listCustomBookingAttributes = async () => {
  console.log('[Uplisting V2] 📡 GET /v2/custom_booking_attributes');
  try {
    const result = await globalLimiter.schedule(() => getClient('v2').get('/v2/custom_booking_attributes'));
    const attrs = result.data?.data || [];
    console.log(`[Uplisting V2] ✅ Found ${attrs.length} custom attribute(s)`);
    return result.data;
  } catch (error) {
    console.error('[Uplisting V2] ❌ GET /v2/custom_booking_attributes FAILED');
    console.error(`[Uplisting V2] Status: ${error.response?.status || 'N/A'}`);
    console.error(`[Uplisting V2] Response: ${JSON.stringify(error.response?.data || error.message)}`);
    throw error;
  }
};

/**
 * Register a new custom booking attribute definition under the homev_ namespace.
 * Maximum 15 attributes per partner account.
 *
 * @param {string} name        - Attribute name in snake_case (must start with "homev_")
 * @param {string} description - Human-readable description of what this attribute stores
 * @returns {Promise<object>} Uplisting API response (HTTP 201 on success)
 */
const createCustomBookingAttribute = async (name, description) => {
  console.log(`[Uplisting V2] 📡 POST /v2/custom_booking_attributes — name: ${name}`);

  if (!name || !description) {
    throw new Error('[Uplisting V2] createCustomBookingAttribute requires name and description.');
  }

  if (!name.startsWith('homev_')) {
    throw new Error(`[Uplisting V2] Attribute name must start with "homev_" (received: "${name}")`);
  }

  const body = {
    data: {
      type: 'custom_booking_attributes',
      attributes: { name, description }
    }
  };

  try {
    const result = await globalLimiter.schedule(() => getClient('v2').post('/v2/custom_booking_attributes', body));
    console.log(`[Uplisting V2] ✅ Custom attribute "${name}" registered — status: ${result.status}`);
    return result.data;
  } catch (error) {
    console.error(`[Uplisting V2] ❌ POST /v2/custom_booking_attributes FAILED for "${name}"`);
    console.error(`[Uplisting V2] Status: ${error.response?.status || 'N/A'}`);
    console.error(`[Uplisting V2] Response: ${JSON.stringify(error.response?.data || error.message)}`);
    throw error;
  }
};

/**
 * Fetch generic non-property specific data
 */
const fetchGlobalData = async (endpoint, params = {}) => {
  console.log(`[Uplisting API] 📡 GET ${endpoint}`, Object.keys(params).length ? params : '');
  try {
    const result = await globalLimiter.schedule(() =>
      getClient().get(endpoint, { params })
    );
    console.log(`[Uplisting API] ✅ GET ${endpoint} — ${result.status} (${(result.data?.data || result.data || []).length || '?'} items)`);
    return result;
  } catch (error) {
    console.error(`[Uplisting API] ❌ GET ${endpoint} FAILED`);
    console.error(`[Uplisting API] Status: ${error.response?.status || 'N/A'}`);
    console.error(`[Uplisting API] Response: ${JSON.stringify(error.response?.data || error.message)}`);
    throw error; // re-throw so callers can still handle it
  }
};

/**
 * Fetch property-specific data routing through the property's specific queue
 */
const fetchPropertyData = async (propertyId, endpoint, params = {}) => {
  console.log(`[Uplisting API] 📡 GET ${endpoint} (property: ${propertyId})`, Object.keys(params).length ? params : '');
  try {
    const result = await propertyLimiters.key(propertyId).schedule(() =>
      getClient().get(endpoint, { params })
    );
    console.log(`[Uplisting API] ✅ GET ${endpoint} (property: ${propertyId}) — ${result.status}`);
    return result;
  } catch (error) {
    console.error(`[Uplisting API] ❌ GET ${endpoint} (property: ${propertyId}) FAILED`);
    console.error(`[Uplisting API] Status: ${error.response?.status || 'N/A'}`);
    console.error(`[Uplisting API] Response: ${JSON.stringify(error.response?.data || error.message)}`);
    throw error;
  }
};

module.exports = {
  globalLimiter,
  propertyLimiters,
  fetchGlobalData,
  fetchPropertyData,
  postPropertyData,
  blockCalendarDates,
  unblockCalendarDates,
  createV2Booking,
  updateV2Booking,
  cancelV2Booking,
  listCustomBookingAttributes,
  createCustomBookingAttribute
};
