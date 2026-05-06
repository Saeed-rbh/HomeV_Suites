"use client";

import { useState, useCallback } from "react";
import StripeWrapper from "@/components/StripeWrapper";
import CheckoutForm from "@/components/CheckoutForm";

/**
 * CheckoutClient
 * A client component that owns the StripeWrapper + CheckoutForm tree.
 * It receives the server-fetched initialTotal and updates it once Stripe
 * confirms the exact charge amount via the onAmountConfirmed callback.
 *
 * This keeps the checkout page itself a Server Component while letting
 * the client side react to the payment intent response.
 */
export default function CheckoutClient({
  listingId,
  checkIn,
  checkOut,
  guests,
  selectedNonRefundable,
  initialTotal,
}) {
  const [confirmedTotal, setConfirmedTotal] = useState(initialTotal);

  const handleAmountConfirmed = useCallback((total) => {
    setConfirmedTotal(total);
  }, []);

  return (
    <StripeWrapper
      listingId={listingId}
      checkIn={checkIn}
      checkOut={checkOut}
      guests={guests}
      selectedNonRefundable={selectedNonRefundable}
      currency="cad"
      onAmountConfirmed={handleAmountConfirmed}
    >
      <CheckoutForm
        listingId={listingId}
        checkIn={checkIn}
        checkOut={checkOut}
        guests={guests}
        selectedNonRefundable={selectedNonRefundable}
        totalPrice={confirmedTotal}
      />
    </StripeWrapper>
  );
}
