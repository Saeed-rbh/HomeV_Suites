const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const { protect: auth } = require('../middleware/auth');
const prisma = require('../db');
const { updateReservationStatus } = require('../services/reservationService');

router.get('/me/reservations', auth, guestController.getMyReservations);
router.get('/reservations/all', guestController.getAllReservations);

// POST /api/guests/me/reservations/:id/cancel
// Authenticated guest self-cancellation — verifies ownership before invoking the full
// Uplisting cancellation flow (cancelV2Booking or date-unblock fallback + refund).
router.post('/me/reservations/:id/cancel', auth, async (req, res) => {
  try {
    const guestId = req.user.id;
    const { id } = req.params;

    // Verify the reservation belongs to this guest
    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found.' });
    }
    if (reservation.guestId !== guestId) {
      return res.status(403).json({ success: false, error: 'Not authorized to cancel this reservation.' });
    }
    if (reservation.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Reservation is already cancelled.' });
    }

    // Delegate to the shared service — this handles Uplisting V2 cancellation,
    // the date-unblock fallback, Stripe refund, and Telegram notification.
    const updated = await updateReservationStatus(id, 'CANCELLED');
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[GuestCancel] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ msg: 'Access denied: Requires Admin privileges' });
        }
        next();
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

router.route('/')
  .get(auth, requireAdmin, guestController.getGuests)
  .post(guestController.createGuest);

router.route('/:id')
  .get(guestController.getGuestById)
  .put(guestController.updateGuest)
  .delete(guestController.deleteGuest);

module.exports = router;

