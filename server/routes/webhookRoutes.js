const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const propertyService = require('../services/propertyService');
const reservationService = require('../services/reservationService');
const { fetchGlobalData } = require('../services/uplistingService');
const { bustCalendarCache } = require('../controllers/propertyController');
const prisma = require('../db');

// Standard security check for Uplisting Webhooks — enforced in all environments.
const verifySignature = (req, res, next) => {
  const signature = req.headers['x-uplisting-signature'];

  if (!signature) {
    console.warn('[Webhook] ⛔ Rejected — missing x-uplisting-signature header');
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  // Uplisting uses HMAC SHA256 of the payload with the Webhook Key
  const payload = JSON.stringify(req.body);
  const hash = crypto.createHmac('sha256', process.env.UPLISTING_WEBHOOK_KEY || 'dev-key')
                     .update(payload)
                     .digest('hex');

  if (hash !== signature) {
    console.warn('[Webhook] ⛔ Rejected — signature mismatch. Expected:', hash, '| Got:', signature);
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
};

const processWebhook = async (event, timestamp) => {
  try {
    const eventType = event.type || event.event || 'unknown';
    console.log(`[Webhook] Processing async event type: "${eventType}"`);

    if (eventType === 'property_created' || eventType === 'property_updated' || eventType === 'property.created' || eventType === 'property.updated') {
      const attr = event.data || event.payload || event;
      const propId = attr.id || attr.uuid;
      
      if (propId) {
        console.log(`[Webhook] Fetching complete property profile for id="${propId}" from Uplisting API...`);
        await propertyService.ingestPropertyFromUplisting(String(propId));
        console.log(`[Webhook] ✅ DB upsert succeeded for property id="${propId}"`);
      } else {
        console.warn('[Webhook] ⚠ Property ID missing from payload');
      }

    } else if (eventType === 'property_removed' || eventType === 'property.removed') {
      const attr = event.data || event.payload || event;
      const propId = attr.id || attr.uuid;
      if (propId) {
        await propertyService.deleteProperty(propId);
        console.log(`[Webhook] ✅ DB delete succeeded for property id="${propId}"`);
      }

    } else if (eventType === 'booking_created' || eventType === 'booking_updated') {
      const attr = event.data || event.payload || event;
      
      // Upsert Guest
      let guestEmail = attr.guest_email || `guest_${attr.id}@example.com`;
      let guest = await prisma.guestProfile.findFirst({ where: { email: guestEmail } });
      if (!guest) {
        guest = await prisma.guestProfile.create({
          data: {
            firstName: attr.guest_name ? attr.guest_name.split(' ')[0] : 'Guest',
            lastName: attr.guest_name ? attr.guest_name.split(' ').slice(1).join(' ') : '',
            email: guestEmail,
            phone: attr.guest_phone || null
          }
        });
      }

      const resData = {
        externalId: String(attr.id),
        startDate: new Date(attr.check_in),
        endDate: new Date(attr.check_out),
        status: attr.status ? attr.status.toUpperCase() : 'CONFIRMED',
        totalPrice: parseFloat(attr.total_price || attr.accomodation_total || 0),
        propertyId: String(attr.property_id || attr.listing_id || 'unknown'),
        guestId: guest.id,
        lastWebhookTimestamp: event.timestamp ? new Date(event.timestamp) : new Date(timestamp)
      };

      try {
        await reservationService.upsertReservation(resData);
        console.log(`[Webhook] ✅ DB upsert succeeded for booking externalId="${resData.externalId}"`);
        // Bust calendar cache so next page load fetches fresh availability
        const pid = String(attr.property_id || attr.listing_id || '');
        if (pid) bustCalendarCache(pid);
      } catch (e) {
        console.error(`[Webhook] ❌ Booking upsert failed (check property relation): ${e.message}`);
      }

    } else if (eventType === 'booking_removed') {
      const attr = event.data || event.payload || event;
      const extId = String(attr.id);
      
      const existing = await prisma.reservation.findUnique({ where: { externalId: extId } });
      if (existing) {
        // Enforce idempotency for deletes if we want, but usually a delete is final
        await reservationService.deleteReservation(existing.id);
        console.log(`[Webhook] ✅ DB delete succeeded for booking externalId="${extId}"`);
      } else {
        console.log(`[Webhook] ℹ Booking externalId="${extId}" not found for deletion.`);
      }

    } else {
      console.log(`[Webhook] ℹ Unhandled event type "${eventType}"`);
    }

  } catch (error) {
    console.error('[Webhook] ❌ UNEXPECTED ERROR during async webhook processing');
    console.error('[Webhook] Error:', error.message);
  }
};

router.post('/uplisting', verifySignature, (req, res) => {
  const timestamp = new Date().toISOString();
  
  // ── 1. Immediately Acknowledge Webhook (Uplisting requires < 5s) ────
  res.status(200).json({ received: true, timestamp });

  // ── 2. Log and Process Asynchronously ────────────────────────────────
  const event = req.body;
  
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`[Webhook] 📨 Incoming Uplisting event at ${timestamp}`);
  console.log('══════════════════════════════════════════════════════════════\n');

  processWebhook(event, timestamp);
});

module.exports = router;
