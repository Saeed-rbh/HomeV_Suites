import Link from "next/link";
import { CheckCircle, Calendar, Home, Download } from "lucide-react";
import { getListingByIdDynamic } from "@/lib/server-fetch";
import { calculatePriceBreakdown, formatCurrency, formatDateRange, normalizeBooking } from "@/lib/booking";

function generateResId() {
  // Deterministic-looking ID based on date — in a real app this comes from the DB
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `RES-${code}`;
}

export default async function BookingConfirmedPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const listingId = resolvedSearchParams.listing;
  const listing = listingId ? await getListingByIdDynamic(Array.isArray(listingId) ? listingId[0] : listingId) : null;
  const booking = normalizeBooking(resolvedSearchParams);
  const breakdown = listing ? calculatePriceBreakdown(listing, booking.checkIn, booking.checkOut, booking.guests) : null;

  // Generate a stable-looking reservation ID (in prod this would come from backend)
  const resId = generateResId();

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#f3f5f8] px-4 py-12 md:px-6 flex items-center justify-center">
      <div className="mx-auto w-full max-w-2xl">
        {/* Success Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#0c1929]">Booking Confirmed</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight text-[#0c1929]">
            You&apos;re all set!
          </h1>
          <p className="mt-3 text-[#0c1929]">
            Your reservation has been confirmed. Check your email for a receipt.
          </p>
          <div className="mt-4 inline-block rounded-full bg-[#0c1929] px-4 py-1.5 text-sm font-mono font-semibold text-white tracking-wider">
            {resId}
          </div>
        </div>

        {/* Booking summary card */}
        {listing && (
          <div className="rounded-[30px] glass-panel p-7 md:p-8 mb-6">
            <div className="flex items-start gap-5">
              {/* Property thumb */}
              <div
                className="h-24 w-24 shrink-0 rounded-2xl bg-cover bg-center"
                style={{ backgroundImage: `url(${listing.images[0]})` }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#0c1929]">{listing.neighborhood}</p>
                <h2 className="mt-1 text-xl font-semibold text-[#0c1929] truncate">{listing.title}</h2>
                <p className="mt-1 text-sm text-[#0c1929]">Hosted by {listing.host}</p>
              </div>
            </div>

            <div className="mt-6 divide-y divide-slate-200/60 text-sm">
              <div className="flex items-center gap-3 py-4">
                <Calendar className="h-4 w-4 text-[#0c1929] shrink-0" />
                <span className="text-[#0c1929]">Dates</span>
                <span className="ml-auto font-medium text-[#0c1929]">{formatDateRange(booking.checkIn, booking.checkOut)}</span>
              </div>
              <div className="flex items-center gap-3 py-4">
                <Home className="h-4 w-4 text-[#0c1929] shrink-0" />
                <span className="text-[#0c1929]">Guests</span>
                <span className="ml-auto font-medium text-[#0c1929]">{booking.guests} guest{booking.guests === 1 ? '' : 's'}</span>
              </div>
              <div className="flex items-center justify-between py-4 font-semibold">
                <span className="text-[#0c1929]">Total charged</span>
                <span className="text-[#0c1929]">{breakdown ? formatCurrency(breakdown.total) : "—"}</span>
              </div>
            </div>
          </div>
        )}

        {/* .ics download button — generates iCal inline */}
        <ICSDownloadButton listing={listing} booking={booking} resId={resId} />

        {/* CTA buttons */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <Link
            href={listing ? `/trips?booking=${listing.id}` : "/trips"}
            className="flex-1 inline-flex items-center justify-center rounded-[24px] bg-[#0c1929] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#152b47]"
          >
            View my trip
          </Link>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center rounded-[24px] border border-slate-200 bg-white px-6 py-4 text-base font-semibold text-[#0c1929] transition hover:bg-slate-50"
          >
            Explore more stays
          </Link>
        </div>
      </div>
    </div>
  );
}

// Client component for .ics download (needs to run in browser)
function ICSDownloadButton({ listing, booking, resId }) {
  if (!listing || !booking.checkIn || !booking.checkOut) return null;

  return (
    <AddToCalendarButton listing={listing} booking={booking} resId={resId} />
  );
}

// Separate client component
import AddToCalendarButton from "@/components/AddToCalendarButton";
