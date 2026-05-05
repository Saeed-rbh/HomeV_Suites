const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getInternalPropertyById } = require('./propertyController');
const { calculatePriceBreakdown } = require('../utils/pricingCalculator');

const createPaymentIntent = async (req, res) => {
  try {
    const { listingId, checkIn, checkOut, guests, selectedNonRefundable, currency = 'cad' } = req.body;

    if (!listingId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Missing required booking details' });
    }

    // Securely fetch property details
    const property = await getInternalPropertyById(listingId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Calculate the secure price breakdown on the server
    const breakdown = calculatePriceBreakdown(
      property, 
      checkIn, 
      checkOut, 
      Number(guests) || 1, 
      Boolean(selectedNonRefundable)
    );

    const amount = breakdown.total;

    // Amount is received in standard units (e.g., dollars), convert to cents for Stripe
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('[Stripe] Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPaymentIntent,
};
