const cron = require('node-cron');
const prisma = require('../db');

const LISTING_MAP_IDS = [537314, 537322, 537336, 537342, 537356];

/**
 * Scrapes a single listing page from book.homevsuites.com and parses details.
 */
async function scrapeListingDetails(mapId) {
  const url = `https://book.homevsuites.com/listings/${mapId}`;
  console.log(`[Scraper] Crawling listing details for ID ${mapId} from ${url}...`);
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const html = await res.text();
    
    // 1. Extract JSON-LD (VacationRental)
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let jsonLdObj = null;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (parsed['@type'] === 'VacationRental') {
          jsonLdObj = parsed;
          break;
        }
      } catch (e) {
        // Ignored
      }
    }
    
    // 2. Extract NextJS RSC payloads
    const nextPushes = [];
    const pushRegex = /self\.__next_f\.push\(\[1,\s*"([\s\S]*?)"\s*\]\)/g;
    let pushMatch;
    while ((pushMatch = pushRegex.exec(html)) !== null) {
      nextPushes.push(pushMatch[1]);
    }
    
    const combinedRsc = nextPushes.map(str => {
      return str
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\n/g, '\n');
    }).join('\n');
    
    // Extract the internal listing object from RSC payload
    let rscListingObj = null;
    const listingStartIdx = combinedRsc.indexOf('"id":');
    if (listingStartIdx !== -1) {
      let braces = 0;
      let cleanStr = "";
      let startChar = listingStartIdx;
      while (startChar > 0 && combinedRsc[startChar] !== '{') {
        startChar--;
      }
      for (let i = startChar; i < combinedRsc.length; i++) {
        const char = combinedRsc[i];
        cleanStr += char;
        if (char === '{') braces++;
        if (char === '}') braces--;
        if (braces === 0) {
          break;
        }
      }
      
      const sanitized = cleanStr.replace(/[\x00-\x1f]/g, (ch) => {
        if (ch === '\n') return '\\n';
        if (ch === '\r') return '\\r';
        if (ch === '\t') return '\\t';
        return '';
      });
      
      try {
        const parsed = JSON.parse(sanitized);
        if (parsed.price !== undefined || parsed.bedroomsNumber !== undefined) {
          rscListingObj = parsed;
        }
      } catch (err) {
        // Ignored
      }
    }
    
    // 3. Extract description text
    let descriptionText = "";
    if (jsonLdObj && jsonLdObj.description) {
      descriptionText = jsonLdObj.description;
    } else {
      const descBlock = combinedRsc.match(/Stay in a modern[\s\S]+?Experience comfort, convenience, and luxury/i);
      if (descBlock) {
        descriptionText = descBlock[0];
      }
    }
    
    const propertyData = {
      title: jsonLdObj ? jsonLdObj.name : (rscListingObj ? rscListingObj.name : null),
      description: descriptionText || (rscListingObj ? rscListingObj.description : null),
      address: jsonLdObj && jsonLdObj.address ? `${jsonLdObj.address.streetAddress || ''}, ${jsonLdObj.address.addressLocality || ''}, ${jsonLdObj.address.addressRegion || ''}, ${jsonLdObj.address.addressCountry || ''}`.replace(/^,\s*/, '').replace(/,\s*,/g, ',') : '155 Yorkville Avenue, Toronto, ON, Canada',
      latitude: jsonLdObj && jsonLdObj.geo ? jsonLdObj.geo.latitude : (rscListingObj ? rscListingObj.lat : null),
      longitude: jsonLdObj && jsonLdObj.geo ? jsonLdObj.geo.longitude : (rscListingObj ? rscListingObj.lng : null),
      images: jsonLdObj ? jsonLdObj.image : (rscListingObj && rscListingObj.listingImage ? rscListingObj.listingImage.map(img => img.url) : []),
      pricePerNight: rscListingObj ? rscListingObj.price : 400,
      capacity: rscListingObj ? rscListingObj.personCapacity : 2,
      bedrooms: rscListingObj ? rscListingObj.bedroomsNumber : 1,
      beds: rscListingObj ? rscListingObj.bedsNumber : 1,
      bathrooms: rscListingObj ? rscListingObj.bathroomsNumber : 1
    };
    
    if (propertyData.title) {
      propertyData.title = propertyData.title.replace(/\\u0026/g, '&').trim();
    }
    
    return propertyData;
  } catch (err) {
    console.error(`[Scraper] Error scraping mapId ${mapId}:`, err.message);
    return null;
  }
}

/**
 * Scrapes all properties and updates/upserts them in the database.
 */
async function scrapeAndSyncProperties() {
  console.log('[Scraper] Starting daily property scrape and sync at:', new Date().toISOString());
  
  const shortTermPolicyId = 'b15f8c85-7174-4e8c-af8a-d15e74fd53d9'; // Strict
  const longTermPolicyId = '22b7b8a1-f4bc-47a4-b3cd-eab402b1ea89'; // Long-Term Standard

  let successCount = 0;
  for (const mapId of LISTING_MAP_IDS) {
    const scraped = await scrapeListingDetails(mapId);
    if (!scraped) continue;

    const idStr = String(mapId);
    
    const propertyData = {
      title: scraped.title,
      nickname: scraped.title.replace(' sleeps ', ' Sleeps '),
      description: scraped.description,
      address: '155 Yorkville Avenue, Toronto, ON, Canada',
      location: 'Toronto, ON',
      neighborhood: 'Yorkville',
      thumbnailUrl: scraped.images && scraped.images.length > 0 ? scraped.images[0] : null,
      images: JSON.stringify(scraped.images || []),
      pricePerNight: parseFloat(scraped.pricePerNight || 400),
      capacity: parseInt(scraped.capacity || 2),
      bedrooms: parseInt(scraped.bedrooms || 1),
      shortTermPolicyId,
      longTermPolicyId
    };

    try {
      await prisma.property.upsert({
        where: { id: idStr },
        update: propertyData,
        create: {
          id: idStr,
          externalId: idStr,
          ...propertyData
        }
      });
      console.log(`[Scraper] Successfully synced property: ${propertyData.title} (${idStr})`);
      successCount++;
    } catch (dbErr) {
      console.error(`[Scraper] Database error syncing property ${idStr}:`, dbErr.message);
    }
    
    // Polite delay
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`[Scraper] Sync completed. Successfully synced ${successCount}/${LISTING_MAP_IDS.length} properties.`);
}

/**
 * Initializes the node-cron scheduler to run daily at midnight.
 */
function startDailyScrapingCron() {
  // Midnight every day: '0 0 * * *'
  console.log('[Scraper] Registering daily property scraper cron task for 00:00...');
  cron.schedule('0 0 * * *', async () => {
    try {
      await scrapeAndSyncProperties();
    } catch (err) {
      console.error('[Scraper] Error running daily cron sync:', err.message);
    }
  });
}

module.exports = {
  scrapeAndSyncProperties,
  startDailyScrapingCron
};
