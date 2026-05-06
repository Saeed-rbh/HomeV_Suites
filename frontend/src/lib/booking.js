function toLocalIso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const DEFAULT_BOOKING = {
  checkIn: "",
  checkOut: "",
  guests: 2,
};

function getValue(source, key) {
  if (!source) return undefined;
  if (typeof source.get === "function") {
    return source.get(key) ?? undefined;
  }
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeBooking(source) {
  const rawCheckIn = getValue(source, "checkIn");
  const rawCheckOut = getValue(source, "checkOut");
  const checkIn = rawCheckIn || DEFAULT_BOOKING.checkIn;
  const checkOut = rawCheckOut || DEFAULT_BOOKING.checkOut;
  const guestsValue = Number(getValue(source, "guests"));
  const guests = Number.isFinite(guestsValue) && guestsValue > 0 ? guestsValue : DEFAULT_BOOKING.guests;

  return {
    checkIn,
    checkOut,
    guests,
    hasExplicitDates: Boolean(rawCheckIn && rawCheckOut),
  };
}

export function getNightCount(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  const nights = Math.round(diff / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 1;
}

/**
 * Calculate price breakdown with a transparent Service Fee.
 *
 * Flow:
 *   1. Sum per-night calendar rates → nightlySubtotal (raw Uplisting rates)
 *   2. Apply length-of-stay & direct-booking discounts → discountedBase
 *   3. Service Fee = (discountedBase + cleaningFee) × SERVICE_FEE_RATE
 *   4. Taxes on (discountedBase + cleaningFee + serviceFee)
 *   5. Total = discountedBase + cleaningFee + serviceFee + taxes
 *
 * Formula:
 *   Service Fee % = (Bundled Gross Total - (Discounted Base + Cleaning Fee))
 *                   / (Discounted Base + Cleaning Fee)
 */
export function calculatePriceBreakdown(listing, checkIn, checkOut, guests = 1, nonRefundable = false) {
  const nights = getNightCount(checkIn, checkOut);
  const calendarRates = listing.calendarRates || {};
  const hasCalendarRates = Object.keys(calendarRates).length > 0;

  // ── 1. Raw nightly subtotal (no markup) ──
  let nightlySubtotal = 0;

  if (hasCalendarRates && checkIn && checkOut) {
    const cursor = new Date(checkIn + "T12:00:00");
    const endDate = new Date(checkOut + "T12:00:00");
    while (cursor < endDate) {
      const dateKey = toLocalIso(cursor);
      const rate = calendarRates[dateKey];
      nightlySubtotal += (rate != null && rate > 0) ? rate : (listing.price || 0);
      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    nightlySubtotal = (listing.price || 0) * nights;
  }

  // ── 2. Bundle cleaning fee & service fee into the nightly total ──
  // Cleaning fee and service fee are NOT shown as separate lines —
  // they are baked into the displayed nightly rate.
  const rawCleaningFee = listing.cleaningFee ?? 0;

  // Service fee rate (tiered by length of stay)
  // < 3n: 11% | 3-5n: 7% | 5-10n: 4% | 10-30n: 3% | > 30n: 0%
  const SERVICE_FEE_RATE = nights < 3 ? 0.11 : nights <= 5 ? 0.07 : nights <= 10 ? 0.04 : nights <= 30 ? 0.03 : 0;

  // Bundled subtotal = (nightly rates + cleaning fee) × (1 + service fee rate)
  const bundledSubtotal = Math.round((nightlySubtotal + rawCleaningFee) * (1 + SERVICE_FEE_RATE));

  // Average nightly rate for display — includes cleaning & service fee
  const avgNightlyRate = nights > 0 ? Math.round(bundledSubtotal / nights) : Math.round(((listing.price || 0) + rawCleaningFee) * (1 + SERVICE_FEE_RATE));

  // ── 3. Discounts (applied to bundled subtotal) ──
  let discountPercentage = 0;
  let discountCaption = "Long Stay Discount";

  if (nights >= 28 && listing.discounts?.monthly) {
    discountPercentage = listing.discounts.monthly;
    discountCaption = listing.discounts.monthlyCaption || "Long Stay Discount";
  } else if (nights >= 7 && listing.discounts?.weekly) {
    discountPercentage = listing.discounts.weekly;
    discountCaption = listing.discounts.weeklyCaption || "Long Stay Discount";
  }

  const discountAmount = Math.round(bundledSubtotal * (discountPercentage / 100));

  // Direct booking discount — tiered to match server's pricingCalculator.js exactly.
  // Short stays (<28 nights): 5% | Long stays (≥28 nights): 8%
  const directBookingDiscountPercentage = nights >= 28 ? 8 : 5;
  const directBookingDiscountCaption = "Direct Booking Discount";
  const directBookingDiscountAmount = Math.round(bundledSubtotal * (directBookingDiscountPercentage / 100));

  const totalDiscountAmount = discountAmount + directBookingDiscountAmount;
  let subtotalAfterDiscount = bundledSubtotal - totalDiscountAmount;

  // ── 3.5 Non-refundable Discount (Applied to subtotalAfterDiscount) ──
  let nonRefundableDiscountAmount = 0;
  let nonRefundableDiscountPercentage = 0;
  
  // Dynamically select the correct cancellation policy based on length of stay
  const activeCancellationPolicy = (nights >= 28 && listing.cancellationPolicy?.longTerm) 
    ? listing.cancellationPolicy.longTerm 
    : (listing.cancellationPolicy?.shortTerm || listing.cancellationPolicy);

  if (nonRefundable && activeCancellationPolicy?.offerNonRefundableDiscount) {
    nonRefundableDiscountPercentage = activeCancellationPolicy.nonRefundableDiscountPercentage;
    nonRefundableDiscountAmount = Math.round(subtotalAfterDiscount * (nonRefundableDiscountPercentage / 100));
    subtotalAfterDiscount -= nonRefundableDiscountAmount;
  }

  // ── 4. Taxes ──
  const taxableBase = subtotalAfterDiscount;
  const currentTaxRate = listing.taxRate ?? 0;
  // For stays >= 28 days, remove the 8.5% tax component
  const effectiveTaxPercentage = currentTaxRate + (nights >= 28 ? 0 : 0.085);
  const taxFromPercentage = Math.round(taxableBase * effectiveTaxPercentage);
  const taxFromFixedBooking = listing.taxFixedPerBooking ?? 0;
  const taxFromFixedNight = (listing.taxFixedPerNight ?? 0) * nights;
  const taxFromPersonNight = (listing.taxFixedPerPersonPerNight ?? 0) * guests * nights;
  const taxes = taxFromPercentage + taxFromFixedBooking + taxFromFixedNight + taxFromPersonNight;

  // ── 5. Grand Total ──
  const total = subtotalAfterDiscount + taxes;

  return {
    nights,
    nightlySubtotal: bundledSubtotal, // bundled (includes cleaning + service fee)
    avgNightlyRate,
    discountPercentage,
    discountCaption,
    discountAmount,
    directBookingDiscountPercentage,
    directBookingDiscountCaption,
    directBookingDiscountAmount,
    totalDiscountAmount: totalDiscountAmount + nonRefundableDiscountAmount,
    subtotalAfterDiscount,
    nonRefundableDiscountAmount,
    nonRefundableDiscountPercentage,
    cleaningFee: 0,      // baked in — not shown separately
    serviceFee: 0,       // baked in — not shown separately
    taxes,
    total,
  };
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateRange(checkIn, checkOut) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${formatter.format(new Date(checkIn))} - ${formatter.format(new Date(checkOut))}`;
}

export function buildBookingQuery(booking, overrides = {}) {
  const query = {
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: String(booking.guests),
    ...overrides,
  };

  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ""));
}

export function getStayPriceLabel(listing, booking) {
  const breakdown = calculatePriceBreakdown(listing, booking.checkIn, booking.checkOut);
  return {
    label: booking.hasExplicitDates ? `${formatCurrency(breakdown.total)} total` : `${formatCurrency(breakdown.avgNightlyRate)} night`,
    detail: booking.hasExplicitDates ? `${breakdown.nights} nights` : listing.specs,
  };
}
