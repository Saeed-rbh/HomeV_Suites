import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  BriefcaseBusiness,
  CarFront,
  ChevronLeft,
  Dumbbell,
  KeyRound,
  MapPin,
  ShieldCheck,
  Star,
  Trees,
  UtensilsCrossed,
  WashingMachine,
  Wifi,
  Wind,
} from "lucide-react";
import ListingGallery from "@/components/ListingGallery";
import { getListingByIdDynamic } from "@/lib/server-fetch";
import FavoriteButton from "@/components/FavoriteButton";
import ListingAmenities from "@/components/ListingAmenities";
import ExpandableText from "@/components/ExpandableText";
import ListingThingsToKnow from "@/components/ListingThingsToKnow";
import ListingMapWrapper from "@/components/ListingMapWrapper";
import HostawayCalendarWidget from "@/components/HostawayCalendarWidget";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const listing = await getListingByIdDynamic(id);

  if (!listing) {
    return {
      title: "Listing Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = `${listing.title} in ${listing.neighborhood || listing.location}`;
  const description = listing.description
    ? listing.description.slice(0, 160).replace(/\n/g, " ").trim()
    : `Book ${listing.title} — a premium ${listing.bedrooms}-bedroom stay in ${listing.neighborhood || listing.location}, Toronto. Sleeps up to ${listing.maxGuests} guests.`;
  const ogImage = listing.images?.[0] || "/hero-villa.png";
  const canonicalUrl = `https://homev.ca/listing/${id}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${listing.title} | HomEV`,
      description,
      url: canonicalUrl,
      siteName: "HomEV",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ],
      locale: "en_CA",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${listing.title} | HomEV`,
      description,
      images: [ogImage],
    },
  };
}

const amenityIcons = {
  wifi: Wifi,
  kitchen: UtensilsCrossed,
  workspace: BriefcaseBusiness,
  parking: CarFront,
  laundry: WashingMachine,
  selfCheckIn: KeyRound,
  airConditioning: Wind,
  elevator: ShieldCheck,
  gym: Dumbbell,
  balcony: Trees,
  patio: Trees,
};

const amenityLabels = {
  wifi: "Fast WiFi",
  kitchen: "Chef kitchen",
  workspace: "Dedicated workspace",
  parking: "On-site parking",
  laundry: "In-suite laundry",
  selfCheckIn: "Self check-in",
  airConditioning: "Air conditioning",
  elevator: "Elevator access",
  gym: "Building gym",
  balcony: "Private balcony",
  patio: "Outdoor patio",
};

const amenityDescriptions = {
  wifi: "500 Mbps fiber — password on the entry card",
  kitchen: "Full-size appliances, cookware, and pantry essentials",
  workspace: "Dedicated desk with monitor-height shelf and fast Wi-Fi",
  parking: "1 reserved underground spot, included with your stay",
  laundry: "In-suite washer & dryer — detergent provided",
  selfCheckIn: "Smart lock with personal access code — no key exchange needed",
  airConditioning: "Central A/C with individual room controls",
  elevator: "Building elevator — step-free access throughout",
  gym: "Building fitness centre, open 24 hours, no charge",
  balcony: "Private outdoor terrace with seating and city views",
  patio: "Ground-floor outdoor patio, fully furnished",
};

function StarRating({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${star <= Math.round(rating)
            ? "fill-amber-400 text-amber-400"
            : "text-slate-300"
            }`}
        />
      ))}
    </span>
  );
}

export default async function ListingPage({ params, searchParams }) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  // Directly fetch from backend 
  let listing = await getListingByIdDynamic(id);

  if (!listing) {
    notFound();
  }

  // Redirect directly to Hostaway booking engine (https://book.homevsuites.com/listings/[id])
  const bookingUrl = listing.bookingUrl || `https://book.homevsuites.com/listings/${listing.id}`;
  
  const checkIn = resolvedSearchParams.checkIn || resolvedSearchParams.start || '';
  const checkOut = resolvedSearchParams.checkOut || resolvedSearchParams.end || '';
  const guests = resolvedSearchParams.guests || resolvedSearchParams.numberOfGuests || '';
  
  const externalQuery = new URLSearchParams();
  if (checkIn) externalQuery.set('start', checkIn);
  if (checkOut) externalQuery.set('end', checkOut);
  if (guests) externalQuery.set('numberOfGuests', String(guests));
  
  const queryStr = externalQuery.toString();
  const targetUrl = queryStr ? `${bookingUrl}?${queryStr}` : bookingUrl;
  redirect(targetUrl);

  // Hostaway listing ID — update this to your actual Hostaway listing ID
  const HOSTAWAY_LISTING_ID = listing.hostawayListingId || 40467;

  // Build JSON-LD structured data for rich snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: listing.title,
    description: listing.description,
    url: `https://homev.ca/listing/${id}`,
    image: listing.images?.[0] || "/hero-villa.png",
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.neighborhood || listing.location,
      addressRegion: "ON",
      addressCountry: "CA",
    },
    ...(listing.latitude && listing.longitude
      ? { geo: { "@type": "GeoCoordinates", latitude: listing.latitude, longitude: listing.longitude } }
      : {}),
    ...(listing.rating && listing.reviews
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: listing.rating,
            reviewCount: listing.reviews,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    numberOfRooms: listing.bedrooms,
    amenityFeature: Object.keys(listing.amenities || {})
      .filter((k) => listing.amenities[k])
      .map((k) => ({ "@type": "LocationFeatureSpecification", name: amenityLabels[k] || k, value: true })),
    priceRange: listing.basePrice ? `From CAD ${listing.basePrice}/night` : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* --- MOBILE LAYOUT --- */}
      <div className="block lg:hidden min-h-screen bg-white pb-[100px]">
        {/* Full-bleed gallery + Floating Nav */}
        <div className="relative">
          <ListingGallery listing={listing} />
          <div className="absolute top-6 left-5 z-20">
            <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm border border-slate-200">
              <ChevronLeft className="h-5 w-5 text-[#0c1929]" />
            </Link>
          </div>
        </div>

        {/* Content Below Hero */}
        <div className="relative z-10 -mt-6 rounded-t-[32px] bg-white px-5 pt-8 pb-12 flex flex-col gap-8 shadow-[0_-8px_16px_rgba(0,0,0,0.05)]">
          {/* Title & Basics */}
          <div className="text-center flex flex-col items-center">
            <h1 className="text-[28px] font-bold tracking-tight text-[#222222] leading-[1.15] mb-3 px-2">
              {listing.title}
            </h1>
            <div className="text-[15px] text-slate-600 mb-1">
              Entire home in {listing.neighborhood || listing.location}
            </div>
            <div className="flex flex-wrap justify-center items-center gap-1.5 text-[15px] text-slate-600">
              <span>{listing.maxGuests} guests</span>
              <span>·</span>
              <span>{listing.bedrooms} bedroom{listing.bedrooms === 1 ? '' : 's'}</span>
              <span>·</span>
              <span>{listing.baths} bath{listing.baths === 1 ? '' : 's'}</span>
            </div>
          </div>

          <div className="h-px w-full bg-slate-200" />

          {/* Host Info */}
          <div className="flex items-center gap-4">
             <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0c1929] text-white font-bold text-lg shrink-0">
               {listing.host?.[0] || "H"}
             </div>
             <div>
               <h2 className="font-semibold text-[#0c1929] text-[16px]">Hosted by {listing.host}</h2>
               <p className="text-sm text-slate-500">Superhost · Quick response</p>
             </div>
          </div>

          <div className="h-px w-full bg-slate-200" />

          {/* Description */}
          <div>
            <h2 className="text-[18px] font-semibold text-[#0c1929] mb-3">About this space</h2>
            <ExpandableText text={listing.description} maxLines={4} />
          </div>

          <div className="h-px w-full bg-slate-200" />

          {/* Amenities */}
          <div>
             <ListingAmenities
                amenities={listing.amenities}
                amenityLabels={amenityLabels}
                amenityDescriptions={amenityDescriptions}
             />
          </div>

          <div className="h-px w-full bg-slate-200" />

          {/* Reviews */}
          {listing.guestReviews && listing.guestReviews.length > 0 && (
            <>
              <div className="h-px w-full bg-slate-200" />
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 fill-[#0c1929] text-[#0c1929]" />
                <span className="text-xl font-bold text-[#0c1929]">{listing.rating} · {listing.reviews} reviews</span>
              </div>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 hide-scrollbar -mx-5 px-5 pb-4">
                {listing.guestReviews.slice(0, 4).map((review, i) => (
                  <div key={i} className="w-[85vw] max-w-[320px] shrink-0 snap-center rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0c1929] text-sm font-bold text-white">
                        {review.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[#0c1929]">{review.author}</p>
                          <p className="text-xs text-[#0c1929] shrink-0">{review.date}</p>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#0c1929] line-clamp-4">{review.text}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="h-px w-full bg-slate-200" />

          {/* Location / Things To Know */}
          <ListingMapWrapper latitude={listing.latitude} longitude={listing.longitude} />
          <ListingThingsToKnow 
            thingsToKnow={listing.thingsToKnow} 
            checkIn={null} 
            cancellationDays={listing.cancellationDays}
            cancellationDescription={listing.cancellationDescription}
            cancellationPolicy={listing.cancellationPolicy}
          />

          <div className="h-px w-full bg-slate-200" />

          {/* Availability Calendar (powered by Hostaway) */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6">
            <h2 className="text-[18px] font-semibold text-[#0c1929] mb-4">Availability &amp; Booking</h2>
            <HostawayCalendarWidget listingId={HOSTAWAY_LISTING_ID} widgetId={`hostaway-calendar-widget-mobile-${id}`} />
          </div>

          {/* Book Now CTA — mobile */}
          <a
            href={listing.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#0c1929] py-4 text-[15px] font-bold text-white shadow-[0_4px_18px_rgba(12,25,41,0.22)] hover:bg-[#152b47] active:scale-[0.98] transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Book on HomEV
          </a>
        </div>
      </div>

      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden lg:block min-h-screen bg-white px-4 pb-16 pt-6 md:px-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#0c1929]">{listing.neighborhood}</p>
            <div className="mt-2">
              <h1 className="text-4xl font-medium tracking-tight text-[#0c1929] md:text-5xl">{listing.title}</h1>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#0c1929]">
              <span>{listing.maxGuests} guests max</span>
              <span>{listing.bedrooms} bedroom{listing.bedrooms === 1 ? '' : 's'}</span>
              <span>{listing.baths} bath{listing.baths === 1 ? '' : 's'}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {listing.location}
              </span>
              {listing.rating && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{listing.rating}</span>
                  {listing.reviewCount && <span className="text-slate-500">({listing.reviewCount} reviews)</span>}
                </span>
              )}
            </div>
          </div>
          {/* Direct booking link — desktop header */}
          <a
            href={listing.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-[14px] bg-[#0c1929] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(12,25,41,0.18)] hover:bg-[#152b47] transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Book on HomEV
          </a>
        </div>

        <ListingGallery listing={listing} />

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-8">
            <section className="rounded-[24px] border border-slate-200 bg-white p-7 md:p-8">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#0c1929]">About this stay</p>
              <h2 className="mt-3 font-medium tracking-tight text-[#0c1929]">
                Hosted by {listing.host} in {listing.neighborhood}
              </h2>
              <div className="mt-5">
                <ExpandableText text={listing.description} maxLines={4} />
              </div>
            </section>

            <ListingAmenities
              amenities={listing.amenities}
              amenityLabels={amenityLabels}
              amenityDescriptions={amenityDescriptions}
            />

            {/* Availability Calendar (powered by Hostaway) */}
            <section className="rounded-[24px] border border-slate-200 bg-white p-7 md:p-8">
              <h2 className="text-sm font-medium uppercase tracking-[0.24em] text-[#0c1929] mb-6">Availability &amp; Booking</h2>
              <HostawayCalendarWidget listingId={HOSTAWAY_LISTING_ID} widgetId={`hostaway-calendar-widget-desktop-${id}`} />
            </section>

            {/* Reviews Section */}
            {listing.guestReviews && listing.guestReviews.length > 0 && (
              <section id="reviews" className="rounded-[24px] border border-slate-200 bg-white p-7 md:p-8">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#0c1929]">Guest Reviews</p>
                  <div className="flex items-center gap-2">
                    <StarRating rating={listing.rating} />
                    <span className="text-sm font-semibold text-[#0c1929]">{listing.rating} · {listing.reviews} reviews</span>
                  </div>
                </div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {listing.guestReviews.slice(0, 4).map((review, i) => (
                    <div key={i} className="rounded-[20px] border border-slate-200 bg-slate-50/50 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0c1929] text-sm font-bold text-white">
                          {review.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[#0c1929]">{review.author}</p>
                            <p className="text-xs text-[#0c1929] shrink-0">{review.date}</p>
                          </div>
                          <StarRating rating={review.rating} />
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[#0c1929]">{review.text}</p>
                    </div>
                  ))}
                </div>
                {listing.guestReviews.length > 4 && (
                  <p className="mt-4 text-sm text-[#0c1929] text-center">
                    And {listing.reviews - 4} more reviews averaging {listing.rating} ★
                  </p>
                )}
              </section>
            )}

            {/* Things To Know Section */}
            <ListingMapWrapper latitude={listing.latitude} longitude={listing.longitude} />
            <ListingThingsToKnow 
              thingsToKnow={listing.thingsToKnow} 
              checkIn={null}
              cancellationDays={listing.cancellationDays}
              cancellationDescription={listing.cancellationDescription}
              cancellationPolicy={listing.cancellationPolicy}
            />
          </div>

          <aside className="lg:sticky lg:top-6 self-start space-y-4">
            {/* Primary Book Now CTA — desktop sidebar */}
            <a
              href={listing.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2.5 rounded-[20px] bg-[#0c1929] px-6 py-4 text-[15px] font-bold text-white shadow-[0_6px_24px_rgba(12,25,41,0.22)] hover:bg-[#152b47] hover:shadow-[0_8px_28px_rgba(12,25,41,0.28)] transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Book on HomEV
            </a>
            {/* Hostaway booking widget on desktop sidebar */}
            <HostawayCalendarWidget listingId={HOSTAWAY_LISTING_ID} widgetId={`hostaway-booking-sidebar-${id}`} />
          </aside>
        </div>
      </div>
    </div>
    </>
  );
}
