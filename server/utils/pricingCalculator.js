function toLocalIso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getNightCount(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  const nights = Math.round(diff / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 1;
}

function calculatePriceBreakdown(listing, checkIn, checkOut, guests = 1, nonRefundable = false) {
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
      nightlySubtotal += (rate != null && rate > 0) ? rate : (listing.pricePerNight || listing.price || 0);
      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    nightlySubtotal = (listing.pricePerNight || listing.price || 0) * nights;
  }

  // ── 2. Bundle cleaning fee & service fee into the nightly total ──
  const rawCleaningFee = listing.cleaningFee ?? 0;

  // Service fee rate (tiered by length of stay)
  const SERVICE_FEE_RATE = nights < 3 ? 0.11 : nights <= 5 ? 0.07 : nights <= 10 ? 0.04 : nights <= 30 ? 0.03 : 0;

  // Bundled subtotal
  const bundledSubtotal = Math.round((nightlySubtotal + rawCleaningFee) * (1 + SERVICE_FEE_RATE));

  const avgNightlyRate = nights > 0 ? Math.round(bundledSubtotal / nights) : Math.round(((listing.pricePerNight || listing.price || 0) + rawCleaningFee) * (1 + SERVICE_FEE_RATE));

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

  const directBookingDiscountPercentage = nights >= 28 ? 8 : 5;
  const directBookingDiscountCaption = "Direct Booking Discount";
  const directBookingDiscountAmount = Math.round(bundledSubtotal * (directBookingDiscountPercentage / 100));

  const totalDiscountAmount = discountAmount + directBookingDiscountAmount;
  let subtotalAfterDiscount = bundledSubtotal - totalDiscountAmount;

  // ── 3.5 Non-refundable Discount (Applied to subtotalAfterDiscount) ──
  let nonRefundableDiscountAmount = 0;
  let nonRefundableDiscountPercentage = 0;
  
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
    nightlySubtotal: bundledSubtotal,
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
    cleaningFee: 0,
    serviceFee: 0,
    taxes,
    total,
  };
}

module.exports = {
  calculatePriceBreakdown,
  getNightCount,
  toLocalIso
};
