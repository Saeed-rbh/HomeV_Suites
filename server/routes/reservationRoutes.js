const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, authorize('ADMIN', 'SUPER_ADMIN', 'PROPERTY_MANAGER'), reservationController.getReservations)
  .post(reservationController.createReservation);

router.route('/:id')
  .get(protect, authorize('ADMIN', 'SUPER_ADMIN', 'PROPERTY_MANAGER'), reservationController.getReservationById)
  .delete(protect, authorize('ADMIN', 'SUPER_ADMIN'), reservationController.deleteReservation);

router.route('/:id/status')
  .patch(protect, authorize('ADMIN', 'SUPER_ADMIN'), reservationController.updateReservationStatus);

module.exports = router;
