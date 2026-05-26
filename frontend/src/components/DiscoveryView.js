"use client";

import { useMemo, useState, useTransition, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { CalendarDays, Users, Search, Minus, Plus, ArrowUpRight, User, X } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import { normalizeBooking, buildBookingQuery, getStayPriceLabel, buildExternalBookingQuery } from "@/lib/booking";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

/* ── Mobile Property Card ── */
function MobilePropertyCard({ listing, booking }) {
  const price = getStayPriceLabel(listing, booking);
  const bookingUrl = listing.bookingUrl || `https://book.homevsuites.com/listings/${listing.id}`;
  const queryParams = new URLSearchParams(buildExternalBookingQuery(booking)).toString();
  const href = queryParams ? `${bookingUrl}?${queryParams}` : bookingUrl;
  return (
    <Link href={href} className="block">
      <div className="flex gap-4 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 active:scale-[0.985] transition-transform">
        <div className="relative w-[110px] h-[110px] rounded-xl overflow-hidden shrink-0 bg-slate-100">
          <Image src={listing.images?.[0] || "/hero-villa.png"} alt={listing.title} fill className="object-cover" sizes="110px" />
        </div>
        <div className="flex flex-col justify-between py-1 min-w-0">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-0.5">{listing.neighborhood || "Toronto"}</p>
            <h3 className="text-[14px] font-semibold text-[#0c1929] leading-snug line-clamp-2">{listing.title}</h3>
            <p className="text-xs text-slate-500 mt-1">{listing.specs}</p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-[15px] font-bold text-[#0c1929]">{price.label}</span>
              {price.sublabel && <span className="text-[11px] text-slate-400 ml-1">{price.sublabel}</span>}
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-[#0c1929]">{listing.rating}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Guest Row ── */
function GuestRow({ label, sublabel, value, onDecrement, onIncrement, canDecrement, canIncrement }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <h4 className="font-semibold text-[#0c1929]">{label}</h4>
        <p className="text-sm text-[#0c1929]">{sublabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onDecrement} disabled={!canDecrement} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-[#0c1929] hover:border-[#0c1929] hover:text-[#0c1929] disabled:opacity-30 transition">
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-4 text-center text-base">{value}</span>
        <button type="button" onClick={onIncrement} disabled={!canIncrement} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-[#0c1929] hover:border-[#0c1929] hover:text-[#0c1929] disabled:opacity-30 transition">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ── Hero Search Bar (glassmorphism) ── */
function HeroSearchBar({ booking, openBelow = false, globalBlockedDates = [], partiallyBlockedDates = [], allListingsBlocked = [] }) {
  const router = useRouter();
  const formRef = useRef(null);
  const calendarPortalRef = useRef(null);
  const [checkIn, setCheckIn] = useState(booking.checkIn);
  const [checkOut, setCheckOut] = useState(booking.checkOut);
  const [adults, setAdults] = useState(Number(booking.guests) || 2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [openPanel, setOpenPanel] = useState(null);
  const [closingPanel, setClosingPanel] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  const handleClosePanel = useCallback(() => {
    setClosingPanel(true);
    setTimeout(() => {
      setOpenPanel(null);
      setClosingPanel(false);
    }, 350);
  }, []);

  useEffect(() => {
    setMounted(true);
    function handleOutside(e) {
      if (
        formRef.current && !formRef.current.contains(e.target) &&
        (!calendarPortalRef.current || !calendarPortalRef.current.contains(e.target))
      ) {
        if (openPanel === "mobile-search") {
          // Backdrop handles it on mobile
        } else {
          setOpenPanel(null);
        }
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") {
        if (openPanel === "mobile-search") {
          handleClosePanel();
        } else {
          setOpenPanel(null);
        }
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => { document.removeEventListener("mousedown", handleOutside); document.removeEventListener("keydown", handleEscape); };
  }, [openPanel, handleClosePanel]);

  function formatFieldDate(v) {
    if (!v) return "SELECT DATE";
    return new Date(`${v}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  }

  function handleSearch(e) {
    e.preventDefault();
    startTransition(() => router.push(`/?${new URLSearchParams(buildBookingQuery({ checkIn, checkOut, guests: adults + childrenCount })).toString()}`));
  }

  return (
    <div ref={formRef} className="relative">
      {/* Desktop Search Bar */}
      <div className="hidden md:flex items-center justify-center gap-1">
        {/* Component 1: Dates (Check-in & Check-out) */}
        <div className="hero-glass-bar flex items-center rounded-full px-1 py-1 min-w-[280px]">
          <button type="button" onClick={() => setOpenPanel(openPanel === "dates" ? null : "dates")}
            className={`flex items-center gap-2 rounded-full px-5 py-3.5 text-left transition ${openPanel === "dates" ? "bg-white/20" : "hover:bg-white/10"}`}>
            <CalendarDays className="h-4 w-4 text-[#0c1929]/75 shrink-0" />
            <div className="flex items-center gap-5">
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[#0c1929]/65">Check-in</span>
                <span className="block text-xs font-semibold text-[#0c1929] mt-0.5 tracking-wide">{formatFieldDate(checkIn)}</span>
              </div>
              <div className="h-7 w-px bg-[#0c1929]/10" />
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[#0c1929]/65">Check-out</span>
                <span className="block text-xs font-semibold text-[#0c1929] mt-0.5 tracking-wide">{formatFieldDate(checkOut)}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Component 2: Guests (Simple Clickable) */}
        <div className="hero-glass-bar flex items-center rounded-full px-1 py-1 min-w-[150px] relative">
          <button type="button" onClick={() => setOpenPanel(openPanel === "guests" ? null : "guests")}
            className={`flex items-center gap-2 rounded-full px-5 py-3.5 text-left transition ${openPanel === "guests" ? "bg-white/20" : "hover:bg-white/10"}`}>
            <Users className="h-4 w-4 text-[#0c1929]/75 shrink-0" />
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[#0c1929]/65">Add Guests</span>
              <span className="block text-xs font-semibold text-[#0c1929] mt-0.5 tracking-wide">{adults + childrenCount} Guests</span>
            </div>
          </button>

          {/* Guests popover */}
          {mounted && openPanel === "guests" && (
            <>
              <div className="fixed inset-0 bg-transparent z-[9998]" onClick={() => setOpenPanel(null)} />
              <div className={`absolute right-0 ${openBelow ? "top-[calc(100%+16px)]" : "bottom-[calc(100%+16px)]"} w-[calc(100vw-32px)] max-w-[380px] z-[9999] rounded-[32px] bg-white shadow-[0_20px_60px_rgba(12,25,41,0.2)] ring-1 ring-slate-200 p-8 cursor-default`}>
                <GuestRow label="Adults" sublabel="Age 13+" value={adults}
                  onDecrement={() => setAdults(Math.max(1, adults - 1))} onIncrement={() => setAdults(Math.min(16, adults + 1))}
                  canDecrement={adults > 1} canIncrement={adults + childrenCount < 16} />
                <div className="w-full border-b border-slate-100 my-1" />
                <GuestRow label="Children" sublabel="Ages 2–12" value={childrenCount}
                  onDecrement={() => setChildrenCount(Math.max(0, childrenCount - 1))} onIncrement={() => setChildrenCount(Math.min(16 - adults, childrenCount + 1))}
                  canDecrement={childrenCount > 0} canIncrement={adults + childrenCount < 16} />
                <div className="pt-2 mt-2">
                  <button type="button" onClick={() => { setOpenPanel(null); handleSearch(); }} className="w-full rounded-[20px] bg-[#0c1929] py-4 text-base font-bold text-white shadow-lg transition hover:bg-[#152b47] active:scale-[0.98]">Apply</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Component 3: Search Button */}
        <button type="button" onClick={handleSearch}
          className="hero-search-btn ml-12 flex items-center gap-2.5 rounded-full px-5 py-4.5 text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all tracking-wider min-h-[66px]">
          <Search className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Search Button */}
      <div className="md:hidden w-full max-w-md mx-auto">
        <button type="button" onClick={() => setOpenPanel("mobile-search")}
          className="hero-glass-bar w-full flex items-center justify-center gap-3 rounded-full px-6 py-4 text-sm font-bold shadow-lg transition-all hover:scale-[1.02]">
          {(!checkIn || !checkOut) && <Search className="h-5 w-5 text-[#0c1929]" />}
          <span className="text-[#0c1929]">
            {checkIn && checkOut ? (
              <>
                {new Date(checkIn + "T00:00:00").toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(checkOut + "T00:00:00").toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                <span className="mx-2 opacity-30">·</span>
                {adults + childrenCount} Guest{adults + childrenCount !== 1 ? 's' : ''}
              </>
            ) : "Start your search"}
          </span>
        </button>
      </div>

      {/* Mobile Search Panel */}
      {mounted && (openPanel === "mobile-search" || closingPanel) && createPortal(
        <>
          <div className={`fixed inset-0 bg-[#0c1929]/40 z-[9998] ${closingPanel ? "mobile-backdrop-close" : "mobile-backdrop-animate"}`} onClick={handleClosePanel} />
          <div className={`fixed inset-x-0 bottom-0 top-[100px] z-[9999] bg-white flex flex-col rounded-t-[32px] ${closingPanel ? "mobile-modal-close" : "mobile-modal-animate"}`}>
            <div className="flex-1 overflow-y-auto p-0 pb-32">
              <div className="flex justify-between items-center px-5 pt-6 mb-4">
                <h2 className="text-xl font-bold">Search</h2>
                <button type="button" onClick={handleClosePanel} className="p-2 rounded-full hover:bg-slate-100 transition bg-slate-50">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6 px-4 sm:px-5">
                <div className="rounded-[24px] border border-slate-100 p-2 sm:p-4 shadow-sm">
                  <AvailabilityCalendar blockedDates={globalBlockedDates} partiallyBlockedDates={partiallyBlockedDates} allListingsBlocked={allListingsBlocked} checkIn={checkIn} checkOut={checkOut}
                    onCheckInChange={setCheckIn} onCheckOutChange={setCheckOut}
                    minNights={0} showHeader={false} />
                </div>
              </div>

              <div className="mb-6 px-5">
                <div className="rounded-[24px] border border-slate-200 p-3 shadow-sm">
                  <GuestRow label="Adults" sublabel="Age 13+" value={adults}
                    onDecrement={() => setAdults(Math.max(1, adults - 1))} onIncrement={() => setAdults(Math.min(16, adults + 1))}
                    canDecrement={adults > 1} canIncrement={adults + childrenCount < 16} />
                  <div className="w-full border-b border-slate-100 my-2" />
                  <GuestRow label="Children" sublabel="Ages 2–12" value={childrenCount}
                    onDecrement={() => setChildrenCount(Math.max(0, childrenCount - 1))} onIncrement={() => setChildrenCount(Math.min(16 - adults, childrenCount + 1))}
                    canDecrement={childrenCount > 0} canIncrement={adults + childrenCount < 16} />
                </div>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-between items-center z-10 rounded-t-[24px] shadow-[0_-4px_20px_rgba(12,25,41,0.05)]">
              <button type="button" onClick={() => { setCheckIn(null); setCheckOut(null); setAdults(2); setChildrenCount(0); }} className="text-base font-semibold underline decoration-2 underline-offset-2">Clear all</button>
              <button type="button" onClick={(e) => { handleClosePanel(); handleSearch(e); }} className="rounded-full bg-[#0c1929] px-8 py-4 text-base font-bold text-white shadow-lg transition flex items-center gap-2 hover:scale-[1.02]">
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Calendar popover */}
      {mounted && openPanel === "dates" && createPortal(
        <div ref={calendarPortalRef} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0c1929]/20">
          <div className="absolute inset-0" onClick={() => setOpenPanel(null)} />
          <div className="relative w-full max-w-[850px] rounded-[32px] bg-white shadow-[0_20px_60px_rgba(12,25,41,0.2)] ring-1 ring-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <AvailabilityCalendar blockedDates={globalBlockedDates} partiallyBlockedDates={partiallyBlockedDates} allListingsBlocked={allListingsBlocked} checkIn={checkIn} checkOut={checkOut}
              onCheckInChange={setCheckIn} onCheckOutChange={(v) => {
                setCheckOut(v);
                if (v) {
                  setOpenPanel(null);
                  startTransition(() => {
                    const query = buildBookingQuery({ checkIn, checkOut: v, guests: adults + childrenCount });
                    router.push(`/?${new URLSearchParams(query).toString()}`);
                  });
                }
              }}
              minNights={0} showHeader={false} onClose={() => setOpenPanel(null)} />
          </div>
        </div>,
        document.body
      )}


    </div>
  );
}

/* ── Avatar cluster ── */
function AvatarCluster() {
  const avatars = [
    { src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=150&h=150&fit=crop", className: "absolute left-[5px] top-[0px] w-[65px] h-[65px] z-10" },
    { src: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=150&h=150&fit=crop", className: "absolute left-[5px] top-[74px] w-[35px] h-[35px] z-20" },
    { src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=150&h=150&fit=crop", className: "absolute left-[53px] top-[55px] w-[55px] h-[55px] z-30" },
  ];
  return (
    <div className="relative w-[110px] h-[100px] shrink-0 ml-4">
      {avatars.map((avatar, i) => (
        <div key={i} className={`rounded-full border-[3px] border-white overflow-hidden shadow-sm ${avatar.className}`}>
          <Image src={avatar.src} alt="" fill className="object-cover" sizes="60px" />
        </div>
      ))}
    </div>
  );
}

/* ── Hero Carousel Component ── */
function HeroCarousel({ visibleListings, slideIndex, booking }) {
  if (!visibleListings || visibleListings.length === 0) {
    return (
      <div className="absolute inset-0 z-[1]">
        <Image src="/hero-villa.png" alt="Property" fill className="object-cover" sizes="(max-width: 1200px) 100vw, 55vw" />
      </div>
    );
  }

  return (
    <>
      {visibleListings.map((listing, i) => (
        <div key={listing.id}
          className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${i === slideIndex ? "opacity-100 z-[1]" : "opacity-0 z-0"}`}>
          <Image
            src={listing.images?.[0] || "/hero-villa.png"}
            alt={listing.title || "Property"}
            fill priority={i === 0}
            className="object-cover"
            sizes="(max-width: 1200px) 100vw, 55vw"
          />
        </div>
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-gradient-to-t from-[#0c1929]/95 via-[#0c1929]/40 to-transparent z-[2] pointer-events-none" />

      {visibleListings.map((listing, i) => {
        const bookingUrl = listing.bookingUrl || `https://book.homevsuites.com/listings/${listing.id}`;
        const queryParams = new URLSearchParams(buildExternalBookingQuery(booking)).toString();
        const lHref = queryParams ? `${bookingUrl}?${queryParams}` : bookingUrl;
        return (
          <div key={`card-${listing.id}`}
            className={`absolute top-10 left-6 min-[1200px]:top-10 min-[1200px]:left-10 z-10 group transition-all duration-[2000ms] ease-in-out ${i === slideIndex ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"}`}>
            <Link href={lHref}
              className="block hero-dark-glass featured-card-hover w-[280px] sm:w-[400px] h-[120px] sm:h-[150px] cursor-pointer rounded-[32px] relative overflow-hidden">
              <div className="absolute top-[15px] left-[15px] sm:top-[20px] sm:left-[20px] w-[140px] sm:w-[205px]">
                <p className="text-[14px] sm:text-[20px] font-medium text-[#0c1929] leading-tight line-clamp-2">{listing.title}</p>
              </div>
              <div className="absolute bottom-[15px] left-[15px] sm:bottom-[20px] sm:left-[20px] flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-[#0c1929] text-white group-hover:bg-[#0c1929]/80 transition-all z-20 shadow-sm">
                <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="absolute inset-y-[4px] right-[4px] aspect-square shrink-0 rounded-[28px] overflow-hidden p-[2px] bg-white/5 ring-1 ring-[#0c1929]/5">
                <div className="relative w-full h-full rounded-[26px] overflow-hidden">
                  <Image src={listing.images?.[0] || "/hero-villa.png"} alt="" fill className="object-cover" sizes="142px" />
                </div>
              </div>
            </Link>
          </div>
        );
      })}

      <div className="absolute bottom-[180px] sm:bottom-[250px] left-1/2 -translate-x-1/2 w-[70%] h-[1px] sm:h-[2px] bg-[#0c1929]/30 z-10" />

      <div className="absolute bottom-16 sm:bottom-[118px] left-0 right-0 z-10 px-7 pb-4 pointer-events-none">
        <div className="relative h-16 sm:h-20 pointer-events-none">
          {visibleListings.map((listing, i) => (
            <p key={`text-${listing.id}`}
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-[70%] text-white text-[14px] sm:text-[17px] leading-relaxed font-normal italic transition-opacity duration-[2000ms] ease-in-out border-l-2 border-white/60 pl-6 ${i === slideIndex ? "opacity-100" : "opacity-0"}`}>
              Enjoy a luxurious {listing.neighborhood} vacation with breathtaking city views.
            </p>
          ))}
        </div>
      </div>
    </>
  );
}
export default function DiscoveryView() {
  const searchParams = useSearchParams();
  const booking = normalizeBooking(searchParams);
  const [hoveredId, setHoveredId] = useState(null);
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(null); // null = unknown until client mounts
  const timerRef = useRef(null);

  // Detect mobile vs desktop — no CSS fighting
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1200);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Compute dates where ALL listings are blocked (no availability)
  const globalBlockedDates = useMemo(() => {
    if (listings.length === 0) return [];
    const allBlockedSets = listings.map(l => new Set(l.blockedDates || []));
    if (allBlockedSets.length === 0) return [];
    const first = allBlockedSets[0];
    return [...first].filter(date => allBlockedSets.every(s => s.has(date)));
  }, [listings]);

  // Compute dates blocked in SOME but not ALL listings (partial availability)
  const partiallyBlockedDates = useMemo(() => {
    if (listings.length === 0) return [];
    const globalSet = new Set(globalBlockedDates);
    const countMap = new Map();
    listings.forEach(l => {
      (l.blockedDates || []).forEach(d => {
        if (!globalSet.has(d)) countMap.set(d, (countMap.get(d) || 0) + 1);
      });
    });
    return [...countMap.keys()];
  }, [listings, globalBlockedDates]);

  // All listings' individual blocked date arrays (for smart checkout validation)
  const allListingsBlocked = useMemo(() =>
    listings.map(l => l.blockedDates || []),
    [listings]
  );

  const handleScroll = useCallback((e) => {
    setIsScrolled(e.target.scrollTop > 5);
  }, []);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/properties')
      .then(res => res.json())
      .then(payload => {
        const data = payload.data || [];
        const mapped = data.map(p => ({
          ...p,
          neighborhood: "Toronto",
          images: p.images?.length > 0 ? p.images : [
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"
          ],
          price: p.pricePerNight || 200,
          specs: `${p.bedrooms || 1} Bed${(p.bedrooms || 1) !== 1 ? 's' : ''}, ${p.bathrooms ?? 1} Bath${(p.bathrooms ?? 1) !== 1 ? 's' : ''}`,
          rating: p.rating || 4.8,
          latitude: p.latitude || 43.65,
          longitude: p.longitude || -79.38
        }));
        setListings(mapped);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  /* Auto-cycle carousel */
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % Math.max(listings.length, 1));
    }, 8000); // Slowed down to 8s
  }, [listings.length]);

  useEffect(() => {
    if (listings.length > 1) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [listings.length, startTimer]);

  const visibleListings = useMemo(() => {
    let filtered = listings;
    if (booking.guests && booking.guests > 0) filtered = filtered.filter(l => l.capacity >= booking.guests);
    if (booking.hasExplicitDates && booking.checkIn && booking.checkOut) {
      filtered = filtered.filter(l => {
        if (!l.blockedDates || l.blockedDates.length === 0) return true;
        return !l.blockedDates.some(bd => bd >= booking.checkIn && bd < booking.checkOut);
      });
    }
    return filtered;
  }, [listings, booking]);



  const slideIndex = visibleListings.length > 0 ? activeSlide % visibleListings.length : 0;
  const activeListing = visibleListings[slideIndex] || null;
  const activeBookingUrl = activeListing ? (activeListing.bookingUrl || `https://book.homevsuites.com/listings/${activeListing.id}`) : "";
  const activeQueryParams = activeListing ? new URLSearchParams(buildExternalBookingQuery(booking)).toString() : "";
  const listingHref = activeListing ? (activeQueryParams ? `${activeBookingUrl}?${activeQueryParams}` : activeBookingUrl) : "/";

  if (isMobile === null || isLoading) {
    const loadingScreen = (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f3f5f8] min-h-[100dvh] overflow-hidden">
        <div className="relative flex flex-col items-center animate-in fade-in duration-1000">
          <img src="/suites-logo.png" alt="HomEV" className="h-12 w-auto object-contain mix-blend-multiply opacity-80 mb-6" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#0c1929] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#0c1929] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#0c1929] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="mt-6 text-[10px] font-bold text-[#0c1929] tracking-[0.3em] uppercase">Curating Premium Stays...</p>
        </div>
      </div>
    );

    // If we're on the client, portal it to the body to ensure full-page coverage
    if (typeof document !== "undefined") {
      return createPortal(loadingScreen, document.body);
    }
    // Fallback for SSR
    return loadingScreen;
  }

  if (isMobile) {
    return (
      <div className="mobile-discovery">
        {/* ── Full-bleed hero ── */}
        <div className="mobile-hero">
          {/* Carousel images */}
          {visibleListings.length > 0 ? visibleListings.map((listing, i) => (
            <div key={listing.id} className={`absolute inset-0 transition-opacity duration-[2000ms] ${i === slideIndex ? "opacity-100" : "opacity-0"}`}>
              <Image src={listing.images?.[0] || "/hero-villa.png"} alt={listing.title || "Property"} fill priority={i === 0} className="object-cover" sizes="100vw" />
            </div>
          )) : (
            <div className="absolute inset-0"><Image src="/hero-villa.png" alt="Property" fill className="object-cover" sizes="100vw" /></div>
          )}
          {/* Gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-gradient-to-t from-[#0c1929]/95 via-[#0c1929]/40 to-transparent z-[2] pointer-events-none" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-[10] flex items-center justify-start px-5 pt-5">
            <Link href="/">
              <img src="/suites-logo.png" alt="HomEV" className="h-9 w-auto object-contain mix-blend-multiply opacity-80" />
            </Link>
          </div>

          {/* Bottom overlay: headline + search */}
          <div className="absolute bottom-0 left-0 right-0 z-[10] px-5 pb-7">
            <p className="text-white/65 text-[10px] font-bold tracking-[0.35em] uppercase mb-2">Toronto · Premium Stays</p>
            <h1 className="mobile-hero-headline">Reserve Your<br />Ideal Holiday</h1>
            {visibleListings.length > 1 && (
              <div className="flex gap-1.5 mt-3 mb-5">
                {visibleListings.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === slideIndex ? "w-5 bg-white" : "w-1.5 bg-white/35"}`} />
                ))}
              </div>
            )}
            <div className="mt-4">
              <HeroSearchBar booking={booking} openBelow={true} globalBlockedDates={globalBlockedDates} partiallyBlockedDates={partiallyBlockedDates} allListingsBlocked={allListingsBlocked} />
            </div>
          </div>
        </div>

        {/* ── Listings sheet ── */}
        <div className="mobile-sheet">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-bold text-[#0c1929]">Available Stays</h2>
              <p className="text-xs text-slate-400 mt-0.5">{visibleListings.length} propert{visibleListings.length !== 1 ? "ies" : "y"} found</p>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 rounded-full px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-700">Live</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pb-12">
            {visibleListings.map(listing => (
              <MobilePropertyCard key={listing.id} listing={listing} booking={booking} />
            ))}
            {visibleListings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-[#0c1929] font-semibold text-sm">No properties found</p>
                <p className="text-slate-400 text-xs mt-1">Try adjusting your search</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-split-layout">
      <div className="hero-left-panel">
        <div className="hero-left-inner">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center">
              <img src="/suites-logo.png" alt="HomEV" className="h-11 w-auto object-contain mix-blend-multiply opacity-80" />
            </Link>
          </div>
          <div className="hero-card-scroll" onScroll={handleScroll}>
            <div className={`mb-10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled ? "opacity-0 -translate-y-8 pointer-events-none" : "opacity-100 translate-y-0"}`}>
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="hero-headline">Reserve Your<br />Ideal Holiday</h1>
                <AvatarCluster />
              </div>
              <div className="mt-6 flex items-center gap-3 w-full">
                <div className="w-10 h-px bg-slate-200 shrink-0" />
                <p className="text-[#0c1929] text-[11px] font-bold tracking-[0.3em] uppercase whitespace-nowrap">Explore the Extraordinary</p>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 pb-20">
              {visibleListings.map(listing => (
                <PropertyCard key={listing.id} property={listing} booking={booking} highlighted={hoveredId === listing.id} onHoverChange={setHoveredId} />
              ))}
              {visibleListings.length === 0 && (
                <div className="col-span-2 flex items-center justify-center py-12 text-[#0c1929] text-sm">No properties match your criteria</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="hero-right-panel">
        <HeroCarousel visibleListings={visibleListings} slideIndex={slideIndex} booking={booking} />

        <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center">
          <HeroSearchBar booking={booking} globalBlockedDates={globalBlockedDates} partiallyBlockedDates={partiallyBlockedDates} allListingsBlocked={allListingsBlocked} />
        </div>
      </div>
    </div>
  );
}
