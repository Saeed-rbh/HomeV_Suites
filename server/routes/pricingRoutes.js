const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');

router.route('/rates')
  .get(pricingController.getRatePlans)
  .post(pricingController.createRatePlan);

module.exports = router;
