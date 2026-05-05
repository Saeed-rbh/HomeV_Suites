const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const { protect: auth } = require('../middleware/auth');

router.get('/me/reservations', auth, guestController.getMyReservations);
router.get('/reservations/all', guestController.getAllReservations);

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
