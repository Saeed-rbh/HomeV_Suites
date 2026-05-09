const reservationService = require('../services/reservationService');
const prisma = require('../db');
const { fetchPropertyData, blockCalendarDates, createV2Booking, updateV2Booking } = require('../services/uplistingService');
const jwt = require('jsonwebtoken');
const { handleError } = require('../utils/errorHandler');

const createReservation = async (req, res) => {
  try {
    let data = { ...req.body };

    // 0. Check for existing guest session
    const authHeader = req.headers.authorization;
    let authGuest = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.user?.id) {
          authGuest = await prisma.guestProfile.findUnique({ where: { id: decoded.user.id } });
          if (authGuest) data.guestId = authGuest.id;
        }
      } catch (e) { /* ignore expired/invalid token */ }
    }

    // 1. Find or create Guest Profile from checkout form data if no session
    if (!data.guestId && data.email) {
      let guest = await prisma.guestProfile.findUnique({ where: { email: data.email } });
      if (!guest) {
        guest = await prisma.guestProfile.create({
          data: {
            email: data.email,
            firstName: data.name?.split(' ')[0] || 'Guest',
            lastName: data.name?.split(' ').slice(1).join(' ') || 'User',
            phone: data.phone || null
          }
        });
      }
      data.guestId = guest.id;
    }

    if (authGuest) {
      data.email = authGuest.email; // Used by downstream logic if needed
    }

    // Extract plain YYYY-MM-DD strings from incoming date fields.
    // We check every possible naming convention used by the frontend.
    const getPlainDate = (d) => d ? (d.includes('T') ? d.split('T')[0] : d) : null;
    
    let plainCheckIn = getPlainDate(data.checkIn) || getPlainDate(data.checkInDate) || getPlainDate(data.startDate);
    let plainCheckOut = getPlainDate(data.checkOut) || getPlainDate(data.checkOutDate) || getPlainDate(data.endDate);

    console.log(`[Reservation] 🛡 Inbound Checkout Request: Guest=${data.email}, Property=${data.propertyId}, Dates=${plainCheckIn}→${plainCheckOut}`);

    data.startDate = plainCheckIn;
    data.endDate = plainCheckOut;
    
    // Pass plain YYYY-MM-DD strings to the request object so the Uplisting block 
    // step later can use them cleanly without timestamp parsing errors.
    req.plainCheckIn = plainCheckIn;
    req.plainCheckOut = plainCheckOut;

    // Prisma requires full ISO-8601 DateTime. Using T12:00:00.000Z ensures the 
    // date doesn't snap backwards a day when rendered in local time (e.g. EDT) on the admin UI.
    if (data.startDate) data.startDate = new Date(data.startDate + 'T12:00:00.000Z').toISOString();
    if (data.endDate)   data.endDate   = new Date(data.endDate   + 'T12:00:00.000Z').toISOString();
    
    const numGuests = req.body.numberOfGuests || req.body.guests || 1;

    const paymentIntentId = data.paymentIntentId;

    // Strip fields not in the Reservation schema
    // (Prisma Reservation model only has these writable fields)
    const ALLOWED_RESERVATION_FIELDS = [
      'startDate', 'endDate', 'status', 'totalPrice', 'selectedNonRefundable',
      'propertyId', 'guestId'
    ];
    Object.keys(data).forEach(k => {
      if (!ALLOWED_RESERVATION_FIELDS.includes(k)) delete data[k];
    });

    if (data.totalPrice === undefined || data.totalPrice <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid reservation amount.' });
    }

    // 2. Ingest real property data from Uplisting if not already in local DB
    if (data.propertyId) {
      let property = await prisma.property.findFirst({
        where: {
          OR: [
            { id: data.propertyId },
            { externalId: data.propertyId }
          ]
        }
      });

      if (!property) {
        // Try to fetch the real property from Uplisting
        let title = 'Property ' + data.propertyId;
        let address = '';
        let images = null;
        let thumbnailUrl = null;
        let description = null;
        let pricePerNight = 200.0;
        let capacity = 4;
        let bedrooms = 2;

        try {
          const response = await fetchPropertyData(data.propertyId, `/properties/${data.propertyId}?include=photos,addresses`);
          const item = response.data?.data || response.data;
          const attr = item?.attributes || {};
          const included = response.data?.included || [];

          // Parse sideloaded addresses and photos
          const addressMap = {};
          const photoMap = {};
          for (const inc of included) {
            if (inc.type === 'addresses') addressMap[inc.id] = inc.attributes;
            else if (inc.type === 'photos') photoMap[inc.id] = inc.attributes.url;
          }

          title = attr.name || attr.nickname || title;
          const addrId = item?.relationships?.address?.data?.id;
          const addrData = addrId ? addressMap[addrId] : null;
          address = addrData
            ? `${addrData.street || ''}, ${addrData.city || ''}, ${addrData.state || ''}, ${addrData.country || ''}`
            : 'Address on file';
          description = attr.description || null;
          
          const photoRefs = item?.relationships?.photos?.data || [];
          const pics = photoRefs.map(p => photoMap[p.id]).filter(Boolean);
          images = pics.length > 0 ? JSON.stringify(pics) : null;
          thumbnailUrl = pics[0] || null;
          pricePerNight = attr.default_daily_rate ? parseFloat(attr.default_daily_rate) : pricePerNight;
          capacity = attr.maximum_capacity ? parseInt(attr.maximum_capacity) : capacity;
          bedrooms = attr.bedrooms ? parseInt(attr.bedrooms) : bedrooms;
        } catch (fetchErr) {
          console.warn(`[Reservation] Could not fetch Uplisting property data: ${fetchErr.message}`);
        }

        property = await prisma.property.create({
          data: {
            id: data.propertyId, // keep ID consistent for FK
            externalId: data.propertyId,
            title,
            address,
            description,
            images,
            thumbnailUrl,
            pricePerNight,
            capacity,
            bedrooms
          }
        });
      }

      // Always use the local DB property ID
      data.propertyId = property.id;
    }

    // 3. Create the reservation
    const reservation = await reservationService.createReservation(data, paymentIntentId);

    // 3b. Push booking to Uplisting via V2 API so it appears on the Uplisting calendar
    //     and syncs across all connected OTA channels (Airbnb, VRBO, Booking.com, etc.).
    //     Falls back to the legacy calendar-block if the V2 call fails.
    console.log(`[Reservation] 🔄 Syncing reservation ${reservation.id} to Uplisting...`);
    try {
      const blockPropId = (
        await prisma.property.findUnique({ where: { id: data.propertyId }, select: { externalId: true } })
      )?.externalId || data.propertyId;

      const rawCheckIn  = req.plainCheckIn;
      const rawCheckOut = req.plainCheckOut;

      if (blockPropId && rawCheckIn && rawCheckOut) {
        // Gather guest info for the Uplisting booking record.
        // We prioritize request body data, then fallback to the authenticated guest session,
        // ensuring we never send undefined fields to Uplisting.
        const guestNameVal  = req.body.name || req.body.guestName || (authGuest ? [authGuest.firstName, authGuest.lastName].filter(Boolean).join(' ') : 'Guest User');
        const guestEmailVal = req.body.email || req.body.guestEmail || authGuest?.email || 'guest@example.com';
        const guestPhoneVal = req.body.phone || req.body.guestPhone || authGuest?.phone || null;
        const guestCountVal = Number(req.body.numberOfGuests || req.body.guests || 1);

        const firstNameVal = guestNameVal?.split(' ')[0] || (authGuest?.firstName || 'Guest');
        const lastNameVal  = guestNameVal?.split(' ').slice(1).join(' ') || (authGuest?.lastName || 'User');

        console.log(`[Reservation] 🔄 Syncing reservation ${reservation.id} to Uplisting...`);
        console.log(`[Reservation] 📊 Params: Property=${blockPropId}, Dates=${rawCheckIn}→${rawCheckOut}, Guest=${guestNameVal} (${guestEmailVal})`);

        try {
          const uplistingResponse = await createV2Booking({
            propertyId:     blockPropId,
            checkIn:        rawCheckIn,
            checkOut:       rawCheckOut,
            guestName:      guestNameVal,
            guestEmail:     guestEmailVal,
            guestPhone:     guestPhoneVal,
            firstName:      firstNameVal,
            lastName:       lastNameVal,
            numberOfGuests: guestCountVal
          });
          const uplistingBookingId = uplistingResponse?.data?.id;

          // Persist the Uplisting booking ID to the local Reservation record
          // so we can reference it later for cancellations/modifications.
          if (uplistingBookingId) {
            try {
              await prisma.reservation.update({
                where: { id: reservation.id },
                data: { uplistingBookingId: String(uplistingBookingId) }
              });
              // Attach the ID to the in-memory object so Telegram can use it immediately
              reservation.uplistingBookingId = String(uplistingBookingId);
              console.log(`[Reservation] 💾 Saved uplistingBookingId=${uplistingBookingId} → reservation ${reservation.id}`);
            } catch (saveErr) {
              console.warn(`[Reservation] ⚠ Could not save uplistingBookingId to DB:`, saveErr.message);
            }
          }

          // Attach HomEV custom attributes to the Uplisting booking record
          if (uplistingBookingId && paymentIntentId) {
            try {
              await updateV2Booking(uplistingBookingId, {
                homev_payment_source:   'stripe',
                homev_stripe_intent_id: paymentIntentId,
                homev_booking_origin:   'website',
                homev_guest_email:      guestEmailVal,
                homev_guest_phone:      guestPhoneVal
              });
            } catch (patchErr) {
              console.warn(`[Reservation] ⚠ Could not attach custom attributes to Uplisting booking ${uplistingBookingId}:`, patchErr.message);
            }
          }
        } catch (err) {
          console.error('[Reservation] ❌ Uplisting V2 booking push FAILED — falling back to legacy calendar block. Error:', err.message);
          // Fallback: block the calendar dates manually if the V2 booking call failed
          await blockCalendarDates(blockPropId, rawCheckIn, rawCheckOut).catch(blockErr =>
            console.error('[Reservation] ⚠ Fallback Uplisting calendar block ALSO FAILED — double-booking risk!', blockErr.message)
          );
        }
      } else {
        console.warn('[Reservation] ⚠ Could not determine property ID or dates for Uplisting V2 booking push');
      }
    } catch (blockErr) {
      console.error('[Reservation] ⚠ Error initiating Uplisting V2 booking push:', blockErr.message);
    }

    // 4. Auto-create a MessageThread for this reservation so chat is immediately ready
    if (data.guestId && data.propertyId) {
      try {
        const thread = await prisma.messageThread.create({
          data: {
            propertyId: data.propertyId,
            guestId: data.guestId,
            reservationId: reservation.id
          }
        });

        // Trigger Telegram Booking Announcement
        const telegramService = require('../services/telegramService');
        const dbGuest = await prisma.guestProfile.findUnique({ where: { id: data.guestId } });
        const dbProperty = await prisma.property.findUnique({ where: { id: data.propertyId } });
        if (dbGuest && dbProperty) {
           telegramService.announceNewBooking(reservation, dbProperty, dbGuest, thread).catch(e => console.error(e));
        }

      } catch (e) { /* thread may already exist */ }
    }

    // 5. Issue a JWT so the guest is auto-logged in
    let token = null;
    if (data.guestId) {
      const payload = { user: { id: data.guestId, role: 'GUEST' } };
      token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    }

    res.status(201).json({ success: true, data: reservation, token });
  } catch (error) {
    console.error('[createReservation]', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

const { fetchGlobalData } = require('../services/uplistingService');

const getReservations = async (req, res) => {
  try {
    // Return all reservations from the local database. 
    // This unifies website-sourced bookings and webhook-synced bookings.
    const reservations = await reservationService.getReservations(req.query);
    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    console.error('[getReservations]', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

const getReservationById = async (req, res) => {
  try {
    const reservation = await reservationService.getReservationById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }
    res.status(200).json({ success: true, data: reservation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'Status is required' });
    
    const reservation = await reservationService.updateReservationStatus(req.params.id, status);
    res.status(200).json({ success: true, data: reservation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const deleteReservation = async (req, res) => {
  try {
    await reservationService.deleteReservation(req.params.id);
    res.status(200).json({ success: true, message: 'Reservation cancelled successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  createReservation,
  getReservations,
  getReservationById,
  updateReservationStatus,
  deleteReservation
};
