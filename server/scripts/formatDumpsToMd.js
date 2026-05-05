/**
 * Convert raw API JSON dumps into organized markdown files.
 * Usage: node scripts/formatDumpsToMd.js
 */
const fs = require('fs');
const path = require('path');

const DUMP_DIR = path.join(__dirname, '..', 'api_dumps');
const OUT_DIR = path.join(__dirname, '..', 'api_dumps');

const files = fs.readdirSync(DUMP_DIR).filter(f => f.startsWith('property_') && f.endsWith('.json'));

for (const file of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(DUMP_DIR, file), 'utf8'));
  const meta = raw._meta;
  const detail = raw.propertyDetail;
  const included = raw.includedResources || [];
  const calendar = raw.calendar;
  const bookings = raw.bookings;
  const attr = detail?.attributes || {};
  const rels = detail?.relationships || {};

  // Build lookup maps
  const byType = {};
  for (const inc of included) {
    if (!byType[inc.type]) byType[inc.type] = [];
    byType[inc.type].push(inc);
  }

  const address = (byType['addresses'] || [])[0]?.attributes || {};
  const photos = (byType['photos'] || []).sort((a, b) => (a.attributes.order || 0) - (b.attributes.order || 0));
  const amenities = byType['amenities'] || [];
  const fees = byType['property_fees'] || [];
  const taxes = byType['property_taxes'] || [];
  const discounts = byType['property_discounts'] || [];
  const policy = (byType['policies'] || [])[0]?.attributes || {};
  const suitability = (byType['suitabilities'] || [])[0]?.attributes || {};
  const securityDeposit = (byType['protect_security_deposit_settings'] || [])[0]?.attributes || {};
  const commissions = byType['channel_commissions'] || [];

  let md = '';

  // ── HEADER ──
  md += `# ${meta.propertyName}\n`;
  md += `> Property ID: \`${meta.propertyId}\`  \n`;
  md += `> Fetched: ${meta.fetchedAt}  \n`;
  md += `> Source: Uplisting API\n\n`;
  md += `---\n\n`;

  // ── 1. CORE ATTRIBUTES ──
  md += `## 1. Core Attributes\n\n`;
  md += `| Field | Value |\n`;
  md += `|-------|-------|\n`;
  md += `| **Name** | ${attr.name || '—'} |\n`;
  md += `| **Nickname** | ${attr.nickname || '—'} |\n`;
  md += `| **Type** | ${attr.type || '—'} |\n`;
  md += `| **Currency** | ${attr.currency || '—'} |\n`;
  md += `| **Time Zone** | ${attr.time_zone || '—'} |\n`;
  md += `| **Check-in Time** | ${attr.check_in_time != null ? attr.check_in_time + ':00' : '—'} |\n`;
  md += `| **Check-out Time** | ${attr.check_out_time != null ? attr.check_out_time + ':00' : '—'} |\n`;
  md += `| **Max Capacity** | ${attr.maximum_capacity ?? '—'} guests |\n`;
  md += `| **Bedrooms** | ${attr.bedrooms ?? '—'} |\n`;
  md += `| **Beds** | ${attr.beds ?? '—'} |\n`;
  md += `| **Bathrooms** | ${attr.bathrooms ?? '—'} |\n`;
  md += `| **Bed Types** | ${(attr.bed_types || []).length > 0 ? attr.bed_types.join(', ') : '—'} |\n`;
  md += `| **Created At** | ${attr.created_at || '—'} |\n`;
  md += `| **Uplisting Domain** | ${attr.uplisting_domain || '—'} |\n`;
  md += `| **Property Slug** | ${attr.property_slug || '—'} |\n`;
  md += `\n`;

  // ── 2. DESCRIPTION ──
  md += `## 2. Description\n\n`;
  md += `\`\`\`\n${attr.description || 'No description available.'}\n\`\`\`\n\n`;

  // ── 3. ADDRESS ──
  md += `## 3. Address\n\n`;
  md += `| Field | Value |\n`;
  md += `|-------|-------|\n`;
  md += `| **Street** | ${address.street || '—'} |\n`;
  md += `| **Suite** | ${address.suite || '—'} |\n`;
  md += `| **City** | ${address.city || '—'} |\n`;
  md += `| **State/Province** | ${address.state || '—'} |\n`;
  md += `| **Zip Code** | ${address.zip_code || '—'} |\n`;
  md += `| **Country** | ${address.country || '—'} |\n`;
  md += `| **Latitude** | ${address.latitude ?? '—'} |\n`;
  md += `| **Longitude** | ${address.longitude ?? '—'} |\n`;
  md += `\n`;

  // ── 4. PHOTOS ──
  md += `## 4. Photos (${photos.length} total)\n\n`;
  md += `| # | URL |\n`;
  md += `|---|-----|\n`;
  photos.forEach((p, i) => {
    md += `| ${i + 1} | ${p.attributes.url} |\n`;
  });
  md += `\n`;

  // ── 5. AMENITIES ──
  md += `## 5. Amenities (${amenities.length} total)\n\n`;
  md += `| ID | Name | Group |\n`;
  md += `|----|------|-------|\n`;
  amenities.forEach(a => {
    md += `| ${a.id} | ${a.attributes.name} | ${a.attributes.group || '—'} |\n`;
  });
  md += `\n`;

  // ── 6. FEES ──
  md += `## 6. Fees (${fees.length} total)\n\n`;
  md += `| Name | Label | Amount | Enabled | Guests Included |\n`;
  md += `|------|-------|--------|---------|------------------|\n`;
  fees.forEach(f => {
    const fa = f.attributes;
    md += `| ${fa.name} | ${fa.label} | $${fa.amount} | ${fa.enabled ? '✅' : '❌'} | ${fa.guests_included ?? '—'} |\n`;
  });
  md += `\n`;

  // ── 7. TAXES ──
  md += `## 7. Taxes (${taxes.length} total)\n\n`;
  md += `| Name | Label | Type | Per | Amount |\n`;
  md += `|------|-------|------|-----|--------|\n`;
  taxes.forEach(t => {
    const ta = t.attributes;
    md += `| ${ta.name} | ${ta.label} | ${ta.type} | ${ta.per} | ${ta.amount} |\n`;
  });
  md += `\n`;

  // ── 8. DISCOUNTS ──
  md += `## 8. Discounts (${discounts.length} total)\n\n`;
  md += `| Name | Label | Type | Min Days | Amount |\n`;
  md += `|------|-------|------|----------|--------|\n`;
  discounts.forEach(d => {
    const da = d.attributes;
    md += `| ${da.name} | ${da.label} | ${da.type} | ${da.days} nights | ${da.amount}% |\n`;
  });
  md += `\n`;

  // ── 9. CANCELLATION POLICY ──
  md += `## 9. Cancellation Policy\n\n`;
  md += `| Field | Value |\n`;
  md += `|-------|-------|\n`;
  md += `| **Type** | ${policy.type || '—'} |\n`;
  md += `| **Description** | ${policy.description || '—'} |\n`;
  md += `\n`;

  // ── 10. SUITABILITY ──
  md += `## 10. Suitability\n\n`;
  md += `| Field | Value |\n`;
  md += `|-------|-------|\n`;
  md += `| **Children** | ${suitability.children ? '✅ Allowed' : '❌ Not allowed'} |\n`;
  md += `| **Pets** | ${suitability.pets ? '✅ Allowed' : '❌ Not allowed'} |\n`;
  md += `| **Events** | ${suitability.events ? '✅ Allowed' : '❌ Not allowed'} |\n`;
  md += `| **Smoking** | ${suitability.smoking ? '✅ Allowed' : '❌ Not allowed'} |\n`;
  md += `\n`;

  // ── 11. SECURITY DEPOSIT ──
  md += `## 11. Security Deposit\n\n`;
  md += `| Field | Value |\n`;
  md += `|-------|-------|\n`;
  md += `| **Amount** | $${securityDeposit.amount ?? '—'} |\n`;
  md += `| **Enabled** | ${securityDeposit.enabled ? '✅' : '❌'} |\n`;
  md += `| **Provider** | ${securityDeposit.provider || '—'} |\n`;
  md += `| **Channels** | ${(securityDeposit.channels || []).join(', ') || '—'} |\n`;
  md += `\n`;

  // ── 12. CHANNEL COMMISSIONS ──
  md += `## 12. Channel Commissions (${commissions.length} total)\n\n`;
  md += `| Channel | Commission % |\n`;
  md += `|---------|-------------|\n`;
  commissions.forEach(c => {
    md += `| ${c.attributes.channel} | ${c.attributes.amount}% |\n`;
  });
  md += `\n`;

  // ── 13. CALENDAR SUMMARY ──
  const days = calendar?.days || [];
  const availableDays = days.filter(d => d.available);
  const blockedDays = days.filter(d => !d.available);
  const rates = days.map(d => d.day_rate).filter(r => r != null && r > 0);
  const minRate = rates.length ? Math.min(...rates) : 0;
  const maxRate = rates.length ? Math.max(...rates) : 0;
  const avgRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;

  md += `## 13. Calendar Summary (${days.length} days loaded)\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| **Date Range** | ${days[0]?.date || '—'} → ${days[days.length - 1]?.date || '—'} |\n`;
  md += `| **Available Days** | ${availableDays.length} |\n`;
  md += `| **Blocked Days** | ${blockedDays.length} |\n`;
  md += `| **Min Rate** | $${minRate} |\n`;
  md += `| **Max Rate** | $${maxRate} |\n`;
  md += `| **Avg Rate** | $${avgRate} |\n`;
  md += `\n`;

  // Show first 30 calendar entries as sample
  md += `### Calendar Detail (first 30 days)\n\n`;
  md += `| Date | Available | Rate | Min Stay | Closed Arrival | Closed Departure |\n`;
  md += `|------|-----------|------|----------|----------------|------------------|\n`;
  days.slice(0, 30).forEach(d => {
    md += `| ${d.date} | ${d.available ? '✅' : '❌'} | $${d.day_rate} | ${d.minimum_length_of_stay ?? d.min_los ?? '—'} | ${d.closed_for_arrival ? '🚫' : '—'} | ${d.closed_for_departure ? '🚫' : '—'} |\n`;
  });
  md += `\n`;

  // ── 14. BOOKINGS ──
  const bookingList = Array.isArray(bookings) ? bookings : [];
  md += `## 14. Bookings (${bookingList.length} total)\n\n`;
  if (bookingList.length === 0) {
    md += `No bookings found.\n\n`;
  } else {
    md += `| # | Check-in | Check-out | Guest | Status | Channel | Total | Currency |\n`;
    md += `|---|----------|-----------|-------|--------|---------|-------|----------|\n`;
    bookingList.forEach((b, i) => {
      const ba = b.attributes || b;
      md += `| ${i + 1} | ${ba.check_in || '—'} | ${ba.check_out || '—'} | ${ba.guest_name || '—'} | ${ba.status || '—'} | ${ba.channel || '—'} | ${ba.total_price ?? ba.payout_price ?? '—'} | ${ba.currency || '—'} |\n`;
    });
    md += `\n`;

    // Show full detail of first booking as sample
    if (bookingList.length > 0) {
      const sample = bookingList[0];
      const sa = sample.attributes || sample;
      md += `### Sample Booking Detail (first booking)\n\n`;
      md += `| Field | Value |\n`;
      md += `|-------|-------|\n`;
      for (const [key, val] of Object.entries(sa)) {
        const display = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—');
        md += `| \`${key}\` | ${display.substring(0, 120)} |\n`;
      }
      md += `\n`;
    }
  }

  // Write MD file
  const mdFilename = file.replace('.json', '.md');
  fs.writeFileSync(path.join(OUT_DIR, mdFilename), md);
  console.log(`✅ Created ${mdFilename}`);
}

console.log('\n🏁 All markdown files created!');
