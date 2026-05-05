const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');

router.route('/')
  .get(calendarController.getCalendarNodes);

router.route('/blocks')
  .post(calendarController.createTimeBlock);

router.route('/blocks/:id/status')
  .patch(calendarController.updateTimeBlockStatus);

module.exports = router;
