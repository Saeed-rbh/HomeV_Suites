// Payments are optional; missing credentials must not prevent API startup.
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

module.exports = stripe;
