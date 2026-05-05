const reservationService = require('../services/reservationService');
const prisma = require('../db');
const { fetchPropertyData, blockCalendarDates } = require('../services/uplistingService');
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

    // Extract plain YYYY-MM-DD strings from incoming date fields
    const getPlainDate = (d) => d ? (d.includes('T') ? d.split('T')[0] : d) : null;
    
    let plainCheckIn = getPlainDate(data.checkInDate) || getPlainDate(data.startDate);
    let plainCheckOut = getPlainDate(data.checkOutDate) || getPlainDate(data.endDate);

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

    // 3b. Block the booked dates in Uplisting to prevent double-booking across
    //     all connected OTA channels (Airbnb, VRBO, Booking.com, etc.)
    //     Uses the externalId (Uplisting property ID) if available, falls back to local ID.
    try {
      const blockPropId = (
        await prisma.property.findUnique({ where: { id: data.propertyId }, select: { externalId: true } })
      )?.externalId || data.propertyId;

      // Use the pre-parsed plain YYYY-MM-DD strings
      const rawCheckIn  = req.plainCheckIn;
      const rawCheckOut = req.plainCheckOut;

      if (blockPropId && rawCheckIn && rawCheckOut) {
        // Fire-and-forget: don't block the response waiting for the API call,
        // but DO log errors so we know if syncing breaks.
        blockCalendarDates(blockPropId, rawCheckIn, rawCheckOut).catch(err =>
          console.error('[Reservation] ⚠ Uplisting calendar block FAILED — double-booking risk!', err.message)
        );
        console.log(`[Reservation] 🔒 Triggered Uplisting calendar block: property=${blockPropId} ${rawCheckIn}→${rawCheckOut}`);
      } else {
        console.warn('[Reservation] ⚠ Could not determine property ID or dates for Uplisting calendar block');
      }
    } catch (blockErr) {
      console.error('[Reservation] ⚠ Error initiating Uplisting calendar block:', blockErr.message);
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
    const response = await fetchGlobalData('/bookings');
    const uplistingBookings = response.data.data || response.data;
    
    const reservations = uplistingBookings.map(item => {
      const attr = item.attributes || item;
      return {
        id: item.id || 'RES-RANDOM',
        guestName: attr.guest_name || 'Uplisting Guest',
        propertyId: item.relationships?.property?.data?.id || 'Unknown',
        checkInDate: attr.check_in || 'N/A',
        checkOutDate: attr.check_out || 'N/A',
        totalPrice: attr.price || 0,
        status: attr.status === 'confirmed' ? 'Upcoming' : 'Pending',
        adults: attr.adults || 1,
        children: attr.children || 0,
        channel: attr.channel || 'Direct',
        createdAt: attr.created_at,
        email: attr.guest_email || 'No Email',
        phone: attr.guest_phone || 'No Phone',
        notes: attr.notes || ''
      };
    });
    
    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    console.error("Direct Proxy Failed, falling back to DB", error.message);
    try {
      const reservations = await reservationService.getReservations(req.query);
      res.status(200).json({ success: true, data: reservations });
    } catch (dbErr) {
      res.status(400).json({ success: false, error: dbErr.message });
    }
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
