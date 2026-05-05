const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

router.route('/')
  .get(reservationController.getReservations)
  .post(reservationController.createReservation);

router.route('/:id')
  .get(reservationController.getReservationById)
  .delete(reservationController.deleteReservation);

router.route('/:id/status')
  .patch(reservationController.updateReservationStatus);

module.exports = router;
