/**
 * Discover all listing IDs from book.homevsuites.com homepage.
 * Looks for /listings/{id} patterns in the HTML + RSC payload.
 */
require('dotenv').config();

async function discoverListingIds() {
  const url = 'https://book.homevsuites.com';
  console.log(`Fetching ${url} ...`);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const html = await res.text();

  // Match any /listings/{number} pattern in the HTML
  const matches = [...html.matchAll(/\/listings\/(\d+)/g)];
  const ids = [...new Set(matches.map(m => m[1]))];

  console.log(`Found ${ids.length} listing IDs:`, ids);
  return ids;
}

discoverListingIds().catch(console.error);
