/**
 * register_custom_attributes.js
 * ─────────────────────────────
 * One-time seed script to register HomEV's custom booking attributes
 * in Uplisting under the "homev_" namespace.
 *
 * Run once:
 *   node scripts/register_custom_attributes.js
 *
 * Safe to re-run — skips any attribute that already exists (409 Conflict).
 */

require('dotenv').config();
const { createCustomBookingAttribute, listCustomBookingAttributes } = require('../services/uplistingService');

const ATTRIBUTES_TO_REGISTER = [
  {
    name: 'homev_payment_source',
    description: 'Payment processor used for this booking (e.g. stripe, manual)'
  },
  {
    name: 'homev_stripe_intent_id',
    description: 'Stripe PaymentIntent ID associated with this booking'
  },
  {
    name: 'homev_booking_origin',
    description: 'Origin channel of this booking (e.g. website, admin, phone)'
  }
];

async function run() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  HomEV — Uplisting Custom Attribute Registration');
  console.log('══════════════════════════════════════════════════\n');

  // 1. Fetch existing attributes to avoid duplicate registration attempts
  let existing = [];
  try {
    const current = await listCustomBookingAttributes();
    existing = (current?.data || []).map(a => a.attributes?.name);
    console.log(`ℹ Already registered (${existing.length}): ${existing.join(', ') || 'none'}\n`);
  } catch (err) {
    console.error('❌ Could not fetch existing attributes:', err.message);
    console.error('   Check your UPLISTING_API_KEY and UPLISTING_CLIENT_ID in .env\n');
    process.exit(1);
  }

  // 2. Register each attribute, skipping those that already exist
  let registered = 0;
  let skipped = 0;
  let failed = 0;

  for (const attr of ATTRIBUTES_TO_REGISTER) {
    if (existing.includes(attr.name)) {
      console.log(`⏭  Skipped  "${attr.name}" — already registered`);
      skipped++;
      continue;
    }

    try {
      await createCustomBookingAttribute(attr.name, attr.description);
      console.log(`✅ Registered "${attr.name}"`);
      registered++;
    } catch (err) {
      // 409 = already exists on Uplisting's side even if not returned in list
      if (err.response?.status === 409) {
        console.log(`⏭  Skipped  "${attr.name}" — already exists (409)`);
        skipped++;
      } else {
        console.error(`❌ Failed   "${attr.name}": ${JSON.stringify(err.response?.data || err.message)}`);
        failed++;
      }
    }
  }

  console.log('\n──────────────────────────────────────────────────');
  console.log(`  Done. Registered: ${registered} | Skipped: ${skipped} | Failed: ${failed}`);
  console.log('──────────────────────────────────────────────────\n');

  if (failed > 0) process.exit(1);
}

run();
