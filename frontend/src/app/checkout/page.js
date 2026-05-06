import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Star } from "lucide-react";
import CheckoutClient from "@/components/CheckoutClient";
import ListingBookingSection from "@/components/ListingBookingSection";
import { buildBookingQuery, formatCurrency, formatDateRange, normalizeBooking } from "@/lib/booking";
import { getListingByIdDynamic } from "@/lib/server-fetch";

export const metadata = {
  title: "Checkout",
  description: "Complete your HomEV reservation securely. Review your stay details and pay with Stripe.",
  robots: { index: false, follow: false },
};

/**
 * Fetch the authoritative price breakdown from the server.
 * This is the exact amount that will be charged by Stripe, so it's used
 * for display AND passed down to CheckoutForm as the stored totalPrice.
 */
async function fetchServerBreakdown(listingId, checkIn, checkOut, guests, selectedNonRefundable) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${apiUrl}/stripe/preview-price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, checkIn, checkOut, guests, selectedNonRefundable }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data : null;
  } catch {
    return null;
  }
}

export default async function CheckoutPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const booking = normalizeBooking(resolvedSearchParams);
  const listingId = resolvedSearchParams.listing;
  const listing = await getListingByIdDynamic(Array.isArray(listingId) ? listingId[0] : listingId || "toronto-loft");

  if (!listing) {
    notFound();
  }

  const isNonRefundable = resolvedSearchParams.nonRefundable === "true";

  // Fetch the server-authoritative breakdown so the page displays the exact Stripe charge.
  // Falls back to 0 if the server is unavailable — StripeWrapper will also return the total
  // via onAmountConfirmed so the displayed price will self-correct after mount.
  const serverPrice = await fetchServerBreakdown(
    listing.id,
    booking.checkIn,
    booking.checkOut,
    booking.guests,
    isNonRefundable
  );
  const serverTotal = serverPrice?.total ?? 0;

  return (
    <div className="min-h-screen bg-[#f3f5f8] px-4 pb-16 pt-6 md:px-6">
      <div className="mx-auto max-w-5xl">

        <div className="mt-2 mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#0c1929]">Checkout</p>
          <h2 className="mt-2 text-3xl font-medium tracking-tight text-[#0c1929]">Confirm your {listing.city || listing.location || "Toronto"} stay</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#0c1929]">
            Complete your booking in just a few steps.
          </p>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <section className="rounded-[30px] bg-white border border-slate-100 shadow-[0_4px_30px_rgba(12,25,41,0.03)] p-7 md:p-8 self-start">
            {/* CheckoutClient is a client component — it owns StripeWrapper + CheckoutForm.
                initialTotal comes from the server; it updates itself once the payment intent
                confirms the exact charge via onAmountConfirmed. */}
            <CheckoutClient
              listingId={listing.id}
              checkIn={booking.checkIn}
              checkOut={booking.checkOut}
              guests={booking.guests}
              selectedNonRefundable={isNonRefundable}
              initialTotal={serverTotal}
            />
          </section>

          <aside className="lg:sticky lg:top-32 self-start space-y-6">
            <ListingBookingSection
              listing={listing}
              initialCheckIn={booking.checkIn}
              initialCheckOut={booking.checkOut}
              initialGuests={booking.guests}
              initialNonRefundable={isNonRefundable}
              isCheckout={true}
              cancellationPolicy={listing.cancellationPolicy}
              serverTotal={serverTotal}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
