import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Star } from "lucide-react";
import CheckoutForm from "@/components/CheckoutForm";
import StripeWrapper from "@/components/StripeWrapper";
import ListingBookingSection from "@/components/ListingBookingSection";
import { buildBookingQuery, calculatePriceBreakdown, formatCurrency, formatDateRange, normalizeBooking } from "@/lib/booking";
import { getListingByIdDynamic } from "@/lib/server-fetch";

export default async function CheckoutPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const booking = normalizeBooking(resolvedSearchParams);
  const listingId = resolvedSearchParams.listing;
  const listing = await getListingByIdDynamic(Array.isArray(listingId) ? listingId[0] : listingId || "toronto-loft");

  if (!listing) {
    notFound();
  }

  const isNonRefundable = resolvedSearchParams.nonRefundable === 'true';
  const breakdown = calculatePriceBreakdown(listing, booking.checkIn, booking.checkOut, booking.guests, isNonRefundable);

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

            <StripeWrapper 
              listingId={listing.id} 
              checkIn={booking.checkIn} 
              checkOut={booking.checkOut} 
              guests={booking.guests} 
              selectedNonRefundable={isNonRefundable}
              currency="cad"
            >
              <CheckoutForm 
                listingId={listing.id} 
                checkIn={booking.checkIn} 
                checkOut={booking.checkOut} 
                guests={booking.guests}
                selectedNonRefundable={isNonRefundable}
                totalPrice={breakdown.total}
              />
            </StripeWrapper>
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
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
