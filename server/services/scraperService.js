const cron = require('node-cron');
const prisma = require('../db');

const BOOKING_SITE = 'https://book.homevsuites.com';

// ─── Discovery ────────────────────────────────────────────────────────────────

/**
 * Fetches the booking site homepage and extracts all listing IDs from
 * /listings/{id} URL patterns in the HTML.
 * Returns an array of numeric IDs, e.g. [537314, 537322, ...].
 */
async function discoverListingIds() {
  console.log(`[Scraper] Discovering listings from ${BOOKING_SITE} ...`);
  try {
    const res = await fetch(BOOKING_SITE, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const matches = [...html.matchAll(/\/listings\/(\d+)/g)];
    const ids = [...new Set(matches.map(m => parseInt(m[1])))];
    console.log(`[Scraper] Discovered ${ids.length} listing IDs: [${ids.join(', ')}]`);
    return ids;
  } catch (err) {
    console.error('[Scraper] Failed to discover listing IDs:', err.message);
    return [];
  }
}

/** Safely parse a JSON string, returning fallback on failure. */
function safeJson(str, fallback = null) {
  if (!str) return fallback;
  if (typeof str !== 'string') return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

/** Extract all self.__next_f.push([1, "..."]) payloads and decode them. */
function extractRscPayload(html) {
  const pushRegex = /self\.__next_f\.push\(\[1,\s*"([\s\S]*?)"\s*\]\)/g;
  const chunks = [];
  let m;
  while ((m = pushRegex.exec(html)) !== null) {
    chunks.push(
      m[1]
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
    );
  }
  return chunks.join('\n');
}

/** Attempt to pull the main listing JSON object out of the RSC payload. */
function parseRscListingObject(rsc) {
  // Look for price or bedroomsNumber as anchors
  const anchors = ['"bedroomsNumber":', '"personCapacity":', '"price":'];
  for (const anchor of anchors) {
    const idx = rsc.indexOf(anchor);
    if (idx === -1) continue;
    // Walk back to find the opening {
    let start = idx;
    while (start > 0 && rsc[start] !== '{') start--;
    // Walk forward to find the matching }
    let braces = 0;
    let end = start;
    for (; end < rsc.length; end++) {
      if (rsc[end] === '{') braces++;
      if (rsc[end] === '}') braces--;
      if (braces === 0) break;
    }
    const raw = rsc.slice(start, end + 1).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
    try {
      const obj = JSON.parse(raw);
      if (obj.price !== undefined || obj.bedroomsNumber !== undefined) return obj;
    } catch {
      // continue to next anchor
    }
  }
  return null;
}

/**
 * Extract a well-structured array from the RSC payload by searching for a
 * JSON key then reading the surrounding array.
 */
function extractRscArray(rsc, key) {
  const search = `"${key}":[`;
  const idx = rsc.indexOf(search);
  if (idx === -1) return null;
  const start = idx + search.length - 1; // points to '['
  let brackets = 0;
  let end = start;
  for (; end < rsc.length; end++) {
    if (rsc[end] === '[') brackets++;
    if (rsc[end] === ']') brackets--;
    if (brackets === 0) break;
  }
  const raw = rsc.slice(start, end + 1).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
  try { return JSON.parse(raw); } catch { return null; }
}

// ─── Core scraper ─────────────────────────────────────────────────────────────

/**
 * Scrapes a single listing page from book.homevsuites.com.
 * Returns a rich object with ALL available data.
 */
async function scrapeListingDetails(mapId) {
  const url = `https://book.homevsuites.com/listings/${mapId}`;
  console.log(`[Scraper] Crawling ${url} ...`);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-CA,en;q=0.9',
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // ── 1. JSON-LD ──────────────────────────────────────────────────────────
    let jsonLd = null;
    const ldRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let ldMatch;
    while ((ldMatch = ldRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(ldMatch[1].trim());
        if (parsed['@type'] === 'VacationRental') { jsonLd = parsed; break; }
      } catch { /* skip */ }
    }

    // ── 2. RSC payload ──────────────────────────────────────────────────────
    const rsc = extractRscPayload(html);
    const rscObj = parseRscListingObject(rsc);

    // ── 3. Extract amenities array ──────────────────────────────────────────
    let amenities = extractRscArray(rsc, 'amenities');
    if (!amenities && rscObj?.amenities) amenities = rscObj.amenities;

    // Normalise amenities: [{id, name, group}]
    if (Array.isArray(amenities)) {
      amenities = amenities.map(a => ({
        id: (a.id || a.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: a.name || a.label || a,
        group: a.group || a.category || 'Amenities'
      }));
    }

    // ── 4. Fees & taxes ─────────────────────────────────────────────────────
    let fees = extractRscArray(rsc, 'fees') || rscObj?.fees || null;
    let taxes = extractRscArray(rsc, 'taxes') || rscObj?.taxes || null;

    // Normalise fees
    if (Array.isArray(fees)) {
      fees = fees.map(f => ({
        label: f.label || f.type || f.name || '',
        amount: parseFloat(f.amount || f.value || 0),
        type: f.type || 'fixed',
        enabled: f.enabled !== false
      }));
    }

    // ── 5. Suitability ──────────────────────────────────────────────────────
    let suitability = rscObj?.suitabilities || rscObj?.suitability || null;
    if (Array.isArray(suitability)) {
      // API often returns [{tag:'children',allowed:true}, ...]
      const suit = { children: true, pets: false, events: false, smoking: false };
      suitability.forEach(s => {
        const tag = (s.tag || s.name || '').toLowerCase();
        const allowed = s.allowed !== false && s.suitable !== false;
        if (tag.includes('children') || tag.includes('infant')) suit.children = allowed;
        if (tag.includes('pet')) suit.pets = allowed;
        if (tag.includes('event') || tag.includes('party')) suit.events = allowed;
        if (tag.includes('smok')) suit.smoking = allowed;
      });
      suitability = suit;
    }

    // ── 6. Images ───────────────────────────────────────────────────────────
    let images = [];
    if (jsonLd?.image) {
      images = Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image];
    } else if (rscObj?.listingImage) {
      images = rscObj.listingImage.map(i => i.url || i).filter(Boolean);
    }
    // Fallback: scrape <img src> tags for CloudFront CDN urls
    if (!images.length) {
      const imgRegex = /https:\/\/djts5lg061pqs\.cloudfront\.net\/[^"'\s?]+/g;
      const found = [...new Set(html.match(imgRegex) || [])];
      images = found.map(u => `${u}?width=2048`);
    }

    // ── 7. Rating & reviews ─────────────────────────────────────────────────
    let rating = null;
    let reviewCount = null;
    if (jsonLd?.aggregateRating) {
      rating = parseFloat(jsonLd.aggregateRating.ratingValue) || null;
      reviewCount = parseInt(jsonLd.aggregateRating.reviewCount) || null;
    }
    if (rating == null && rscObj?.reviewsTotal) {
      reviewCount = parseInt(rscObj.reviewsTotal) || null;
    }
    if (rating == null && rscObj?.starRating) {
      rating = parseFloat(rscObj.starRating) || null;
    }
    // Scrape from HTML as last resort
    if (rating == null) {
      const ratingMatch = html.match(/(\d\.\d)\s*<\/span>\s*\(\s*(\d+)\s*review/i)
        || html.match(/"ratingValue":\s*"?([\d.]+)"?/);
      if (ratingMatch) rating = parseFloat(ratingMatch[1]);
    }
    if (reviewCount == null) {
      const rcMatch = html.match(/(\d+)\s*review/i);
      if (rcMatch) reviewCount = parseInt(rcMatch[1]);
    }

    // ── 8. Description ──────────────────────────────────────────────────────
    let description = jsonLd?.description || rscObj?.description || null;

    // ── 9. Address / location ───────────────────────────────────────────────
    let address = '155 Yorkville Avenue, Toronto, ON, Canada';
    let city = 'Toronto', state = 'ON', country = 'Canada', zipCode = '';
    if (jsonLd?.address) {
      const a = jsonLd.address;
      address = [a.streetAddress, a.addressLocality, a.addressRegion, a.addressCountry]
        .filter(Boolean).join(', ');
      city = a.addressLocality || city;
      state = a.addressRegion || state;
      country = a.addressCountry || country;
      zipCode = a.postalCode || zipCode;
    }

    // ── 10. Title & basics ──────────────────────────────────────────────────
    let title = jsonLd?.name || rscObj?.name || null;
    if (title) title = title.replace(/\\u0026/g, '&').trim();

    const pricePerNight = parseFloat(rscObj?.price) || 400;
    const capacity = parseInt(rscObj?.personCapacity) || 2;
    const bedrooms = parseInt(rscObj?.bedroomsNumber) || 1;
    const beds = parseInt(rscObj?.bedsNumber) || bedrooms;
    const bathrooms = parseFloat(rscObj?.bathroomsNumber) || 1;
    const latitude = jsonLd?.geo?.latitude || rscObj?.lat || null;
    const longitude = jsonLd?.geo?.longitude || rscObj?.lng || null;
    const checkInTime = parseInt(rscObj?.checkInTime) || 15;
    const checkOutTime = parseInt(rscObj?.checkOutTime) || 11;
    const minStay = parseInt(rscObj?.minNights || rscObj?.minStay) || 1;
    const cancellationType = rscObj?.cancellationType || null;
    const cancellationDescription = rscObj?.cancellationDescription || null;

    return {
      title,
      description,
      address,
      city, state, country, zipCode,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      images,
      pricePerNight,
      capacity,
      bedrooms,
      beds,
      bathrooms,
      rating,
      reviewCount,
      checkInTime,
      checkOutTime,
      minStay,
      amenities,
      fees,
      taxes,
      suitability,
      cancellationType,
      cancellationDescription,
    };

  } catch (err) {
    console.error(`[Scraper] Error scraping mapId ${mapId}:`, err.message);
    return null;
  }
}

// ─── Sync all properties ──────────────────────────────────────────────────────

const SHORT_TERM_POLICY_ID = 'b15f8c85-7174-4e8c-af8a-d15e74fd53d9';
const LONG_TERM_POLICY_ID  = '22b7b8a1-f4bc-47a4-b3cd-eab402b1ea89';

async function scrapeAndSyncProperties() {
  console.log('[Scraper] Starting property scrape & sync at:', new Date().toISOString());

  // ── 1. Discover live listing IDs from the booking site ────────────────────
  const liveIds = await discoverListingIds();

  if (!liveIds.length) {
    console.warn('[Scraper] Could not discover any listing IDs. Aborting sync.');
    return 0;
  }

  // ── 2. Get all existing property IDs in our DB ────────────────────────────
  const existingProps = await prisma.property.findMany({
    select: { id: true, title: true }
  });
  const existingIds = new Set(existingProps.map(p => p.id));
  const liveIdStrings = new Set(liveIds.map(String));

  // ── 3. Mark removed listings as inactive ─────────────────────────────────
  const removedIds = [...existingIds].filter(id => !liveIdStrings.has(id));
  if (removedIds.length) {
    console.log(`[Scraper] ${removedIds.length} listing(s) no longer on booking site — marking inactive: [${removedIds.join(', ')}]`);
    for (const id of removedIds) {
      try {
        await prisma.property.update({
          where: { id },
          data: { isActive: false }
        });
        console.log(`[Scraper] ⚪ Marked inactive: ${id}`);
      } catch (e) {
        console.warn(`[Scraper] Could not mark ${id} inactive:`, e.message);
      }
    }
  }

  // ── 4. New listings that don't exist in DB yet ───────────────────────────
  const newIds = liveIds.filter(id => !existingIds.has(String(id)));
  if (newIds.length) {
    console.log(`[Scraper] 🆕 ${newIds.length} new listing(s) found: [${newIds.join(', ')}]`);
  }

  // ── 5. Scrape & upsert all live listings ──────────────────────────────────
  let successCount = 0;
  for (const mapId of liveIds) {
    const scraped = await scrapeListingDetails(mapId);
    if (!scraped) {
      console.warn(`[Scraper] No data returned for mapId ${mapId}, skipping.`);
      continue;
    }

    const idStr = String(mapId);
    const bookingUrl = `${BOOKING_SITE}/listings/${mapId}`;
    const isNew = !existingIds.has(idStr);

    const propertyData = {
      title:       scraped.title || `Property ${idStr}`,
      nickname:    scraped.title,
      description: scraped.description,
      address:     scraped.address || '155 Yorkville Avenue, Toronto, ON, Canada',
      location:    `${scraped.city || 'Toronto'}, ${scraped.state || 'ON'}`,
      neighborhood:'Yorkville',
      city:        scraped.city || 'Toronto',
      state:       scraped.state || 'ON',
      country:     scraped.country || 'Canada',
      zipCode:     scraped.zipCode || '',
      latitude:    scraped.latitude,
      longitude:   scraped.longitude,
      bookingUrl,
      isActive:    true,  // explicitly mark active on every sync
      thumbnailUrl: scraped.images?.length ? scraped.images[0] : null,
      images:       JSON.stringify(scraped.images || []),
      pricePerNight: scraped.pricePerNight,
      capacity:      scraped.capacity,
      bedrooms:      scraped.bedrooms,
      beds:          scraped.beds,
      bathrooms:     scraped.bathrooms,
      rating:        scraped.rating,
      reviewCount:   scraped.reviewCount,
      checkInTime:   scraped.checkInTime,
      checkOutTime:  scraped.checkOutTime,
      minStay:       scraped.minStay,
      amenities:     scraped.amenities   ? JSON.stringify(scraped.amenities)   : null,
      fees:          scraped.fees        ? JSON.stringify(scraped.fees)        : null,
      taxes:         scraped.taxes       ? JSON.stringify(scraped.taxes)       : null,
      suitability:   scraped.suitability ? JSON.stringify(scraped.suitability) : null,
      cancellationType:        scraped.cancellationType,
      cancellationDescription: scraped.cancellationDescription,
      shortTermPolicyId: SHORT_TERM_POLICY_ID,
      longTermPolicyId:  LONG_TERM_POLICY_ID,
    };

    try {
      await prisma.property.upsert({
        where:  { id: idStr },
        update: propertyData,
        create: { id: idStr, externalId: idStr, ...propertyData },
      });
      const badge = isNew ? '🆕' : '✅';
      console.log(`[Scraper] ${badge} ${propertyData.title} (${idStr}) — ${scraped.images?.length || 0} images, rating: ${scraped.rating}`);
      successCount++;
    } catch (dbErr) {
      console.error(`[Scraper] ❌ DB error for ${idStr}:`, dbErr.message);
    }

    await new Promise(r => setTimeout(r, 1200)); // polite delay
  }

  const summary = `${successCount}/${liveIds.length} synced`
    + (newIds.length ? `, ${newIds.length} new` : '')
    + (removedIds.length ? `, ${removedIds.length} removed` : '');
  console.log(`[Scraper] Sync done: ${summary}.`);
  return successCount;
}

// ─── Cron ─────────────────────────────────────────────────────────────────────

function startDailyScrapingCron() {
  console.log('[Scraper] Registering daily scrape cron @ 00:00...');
  cron.schedule('0 0 * * *', async () => {
    try { await scrapeAndSyncProperties(); }
    catch (err) { console.error('[Scraper] Cron error:', err.message); }
  });
}

module.exports = { scrapeAndSyncProperties, startDailyScrapingCron };
