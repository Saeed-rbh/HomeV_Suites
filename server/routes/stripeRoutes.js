const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');
const { apiLimiter } = require('../middleware/rateLimiter');

// Rate-limited: 100 requests/min per IP.
// No auth required (guests pay before having an account), but we throttle
// to prevent pricing scraping and Stripe API abuse.
router.post('/preview-price',          apiLimiter, stripeController.previewPrice);
router.post('/create-payment-intent',  apiLimiter, stripeController.createPaymentIntent);

module.exports = router;
