const stripe = require('../utils/stripeClient');
const { getInternalPropertyById } = require('./propertyController');
const { calculatePriceBreakdown } = require('../utils/pricingCalculator');

/**
 * POST /stripe/preview-price
 * Returns the server-authoritative price breakdown without creating a Stripe payment intent.
 * Used by the checkout page (server component) to display the correct total before payment.
 */
const previewPrice = async (req, res) => {
  try {
    const { listingId, checkIn, checkOut, guests, selectedNonRefundable } = req.body;

    if (!listingId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Missing required booking details' });
    }

    const property = await getInternalPropertyById(listingId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const breakdown = calculatePriceBreakdown(
      property,
      checkIn,
      checkOut,
      Number(guests) || 1,
      Boolean(selectedNonRefundable)
    );

    res.json({ success: true, total: breakdown.total, breakdown });
  } catch (error) {
    console.error('[Stripe] Error computing price preview:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /stripe/create-payment-intent
 * Creates a Stripe PaymentIntent for the server-computed total.
 * Returns clientSecret AND the confirmed total so the frontend never needs to guess the amount.
 */
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

    // Return clientSecret AND the server-computed total so the UI always shows the exact charge
    res.json({
      clientSecret: paymentIntent.client_secret,
      total: amount,
      breakdown,
    });
  } catch (error) {
    console.error('[Stripe] Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  previewPrice,
  createPaymentIntent,
};
