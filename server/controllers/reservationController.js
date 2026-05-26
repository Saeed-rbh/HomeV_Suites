const reservationService = require('../services/reservationService');
const prisma = require('../db');
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
        // Property not found in DB — create a minimal placeholder record
        // so the FK constraint on Reservation is satisfied.
        console.warn(`[Reservation] Property ${data.propertyId} not found in DB — creating placeholder.`);
        property = await prisma.property.create({
          data: {
            id: data.propertyId,
            externalId: data.propertyId,
            title: 'Property ' + data.propertyId,
            address: 'Address on file',
            pricePerNight: 200.0,
            capacity: 4,
            bedrooms: 2
          }
        });
      }

      // Always use the local DB property ID
      data.propertyId = property.id;
    }

    // 3. Create the reservation
    const reservation = await reservationService.createReservation(data, paymentIntentId);

    // NOTE: Uplisting sync has been removed (no longer have access).
    // Bookings are stored locally in the DB and processed through Stripe.
    // Calendar sync to OTAs is now managed via Hostaway's own dashboard.
    console.log(`[Reservation] ✅ Reservation ${reservation.id} saved to DB. No PMS sync (Hostaway widget mode).`);

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
