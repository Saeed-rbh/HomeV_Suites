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

const apiClient = axios.create({
  baseURL: 'https://connect.uplisting.io',
  headers: {
    'Authorization': `Basic ${Buffer.from(API_KEY).toString('base64')}`,
    'Content-Type': 'application/json'
  }
});

/**
 * POST property-specific data (e.g. calendar updates) through the property's queue
 */
const postPropertyData = async (propertyId, endpoint, body = {}) => {
  console.log(`[Uplisting API] 📡 POST ${endpoint} (property: ${propertyId})`);
  try {
    const result = await propertyLimiters.key(propertyId).schedule(() =>
      apiClient.post(endpoint, body)
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
  console.log(`[Uplisting API] 🛑 Writing to calendar is temporarily disabled. Would have blocked: ${checkIn} → ${checkOut} for property ${propertyId}`);
  return;

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
  console.log(`[Uplisting API] 🛑 Writing to calendar is temporarily disabled. Would have unblocked: ${checkIn} → ${checkOut} for property ${propertyId}`);
  return;

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

/**
 * Fetch generic non-property specific data
 */
const fetchGlobalData = async (endpoint, params = {}) => {
  console.log(`[Uplisting API] 📡 GET ${endpoint}`, Object.keys(params).length ? params : '');
  try {
    const result = await globalLimiter.schedule(() => apiClient.get(endpoint, { params }));
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
    const result = await propertyLimiters.key(propertyId).schedule(() => apiClient.get(endpoint, { params }));
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
  unblockCalendarDates
};
