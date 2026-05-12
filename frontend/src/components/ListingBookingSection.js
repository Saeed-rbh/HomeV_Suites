"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, X, Diamond, Tag, Star, Minus, Plus } from "lucide-react";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import { createPortal } from "react-dom";
import Image from "next/image";

import { calculatePriceBreakdown, formatDateRange } from "@/lib/booking";

// ── helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
function formatIso(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function formatNightLabel(ci, co) {
  if (!ci || !co) return "";
  const fmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `${fmt.format(new Date(ci + "T12:00:00"))} - ${fmt.format(new Date(co + "T12:00:00"))}`;
}

export default function ListingBookingSection({ 
  listing, 
  initialCheckIn, 
  initialCheckOut, 
  initialGuests, 
  initialNonRefundable = false, 
  isCheckout = false, 
  cancellationPolicy,
  layout = "both",
  serverTotal = null,   // Server-authoritative total — overrides frontend calc on checkout page
}) {
  const [checkIn, setCheckIn] = useState(initialCheckIn || "");
  const [checkOut, setCheckOut] = useState(initialCheckOut || "");
  const [adults, setAdults] = useState(Number(initialGuests) || 1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [guestPopupStyle, setGuestPopupStyle] = useState({});
  const [mountedPortal, setMountedPortal] = useState(false);
  const [nonRefundable, setNonRefundable] = useState(initialNonRefundable);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [closingPanel, setClosingPanel] = useState(false);
  const [priceSheetOpen, setPriceSheetOpen] = useState(false);
  const [closingPriceSheet, setClosingPriceSheet] = useState(false);
  const guestBtnRef = useRef(null);
  const reserveBtnRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClosePanel = () => {
    setClosingPanel(true);
    setTimeout(() => {
      setMobileSheetOpen(false);
      setClosingPanel(false);
    }, 350);
  };

  const handleClosePriceSheet = () => {
    setClosingPriceSheet(true);
    setTimeout(() => {
      setPriceSheetOpen(false);
      setClosingPriceSheet(false);
    }, 350);
  };

  const totalGuests = adults + children;
  const maxGuests = listing.maxGuests || 6;

  useEffect(() => { setMountedPortal(true); }, []);

  // Prevent background scrolling when any modal is open
  useEffect(() => {
    if (mobileSheetOpen || priceSheetOpen || calendarOpen || guestOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSheetOpen, priceSheetOpen, calendarOpen, guestOpen]);

  const breakdown = useMemo(
    () => calculatePriceBreakdown(listing, checkIn, checkOut, totalGuests, nonRefundable),
    [listing, checkIn, checkOut, totalGuests, nonRefundable]
  );

  const standardBreakdown = useMemo(
    () => calculatePriceBreakdown(listing, checkIn, checkOut, totalGuests, false),
    [listing, checkIn, checkOut, totalGuests]
  );

  const nonRefBreakdown = useMemo(
    () => calculatePriceBreakdown(listing, checkIn, checkOut, totalGuests, true),
    [listing, checkIn, checkOut, totalGuests]
  );

  const hasBooking = Boolean(checkIn && checkOut && breakdown.nights > 0);

  // Broadcast reserve button visibility for sticky header CTA
  useEffect(() => {
    if (isCheckout) return;
    const el = reserveBtnRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.dispatchEvent(new CustomEvent('reserve-btn-visibility', {
          detail: {
            visible: entry.isIntersecting,
            hasBooking,
            total: breakdown.total,
            listingId: listing.id,
            checkIn,
            checkOut,
            guests: totalGuests,
            nonRefundable,
            avgNightlyRate: breakdown.avgNightlyRate,
            nights: breakdown.nights,
          }
        }));
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isCheckout, hasBooking, breakdown.total, listing.id, checkIn, checkOut, totalGuests, nonRefundable, breakdown.avgNightlyRate, breakdown.nights]);

  let unlocksNewDiscount = false;
  let extendedBreakdown = null;
  let extensionPriceDiff = 0;

  if (hasBooking) {
    // Calculate if 1 more night unlocks a new discount
    const extensionCheckOut = new Date(checkOut);
    extensionCheckOut.setDate(extensionCheckOut.getDate() + 1);
    extendedBreakdown = calculatePriceBreakdown(listing, checkIn, extensionCheckOut.toISOString().split("T")[0], totalGuests);
    
    if (extendedBreakdown.discountPercentage > breakdown.discountPercentage) {
      unlocksNewDiscount = true;
      extensionPriceDiff = extendedBreakdown.total - breakdown.total;
    }
  }

  const activeCancellationPolicy = (breakdown.nights >= 28 && cancellationPolicy?.longTerm) 
    ? cancellationPolicy.longTerm 
    : (cancellationPolicy?.shortTerm || cancellationPolicy);

  let cancellationText = "";
  let partialCancellationText = "";
  if (checkIn) {
    if (activeCancellationPolicy) {
      const cancelDate = new Date(checkIn + "T15:00:00");
      cancelDate.setDate(cancelDate.getDate() - activeCancellationPolicy.fullRefundDaysPrior);
      const fmtFull = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(cancelDate);
      
      cancellationText = isCheckout 
        ? `Cancel before ${new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(cancelDate)} for a full refund.` 
        : `Free cancellation before ${fmtFull}.`;

      if (activeCancellationPolicy.partialRefundDaysPrior > 0) {
         const partialDate = new Date(checkIn + "T15:00:00");
         partialDate.setDate(partialDate.getDate() - activeCancellationPolicy.partialRefundDaysPrior);
         const fmtPartial = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(partialDate);
         partialCancellationText = `Cancel between ${fmtFull} and ${fmtPartial} for a ${activeCancellationPolicy.partialRefundPercentage}% refund.`;
      }
    } else {
      const policy = listing.cancellationType || "Moderate";
      let cancelDays = listing.cancellationDays || 5;
      if (!listing.cancellationDays) {
        if (policy === "Flexible") cancelDays = 1;
        else if (policy === "Strict" || policy === "Firm") cancelDays = 14;
        else if (policy === "Super Strict 30") cancelDays = 30;
      }
      const cancelDate = new Date(checkIn + "T15:00:00");
      cancelDate.setDate(cancelDate.getDate() - cancelDays);
      
      cancellationText = isCheckout 
        ? `Cancel before ${new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(cancelDate)} for a full refund.` 
        : `Free cancellation before ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(cancelDate)}`;
    }
  }

  // On the checkout page, use the server-computed total so the sidebar always matches Stripe.
  // On listing pages (no serverTotal), use the local breakdown for instant interactive feedback.
  const displayedTotal = (isCheckout && serverTotal != null && serverTotal > 0) ? serverTotal : breakdown.total;
  const nonRefundableAmount = breakdown.nonRefundableDiscountAmount;

  const handleCheckInChange = (val) => {
    setCheckIn(val || "");
    if (val && checkOut && val >= checkOut) setCheckOut("");
    updateUrlParams(val || "", checkOut);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('syncCheckIn', { detail: val || "" }));
    }
  };
  const handleCheckOutChange = (val) => {
    setCheckOut(val || "");
    if (val) setCalendarOpen(false);
    updateUrlParams(checkIn, val || "");
  };

  const updateUrlParams = (newIn, newOut, newNonRef = nonRefundable) => {
    const params = new URLSearchParams(searchParams);
    if (newIn) params.set("checkin", newIn);
    else params.delete("checkin");
    
    if (newOut) params.set("checkout", newOut);
    else params.delete("checkout");
    
    if (newNonRef) params.set("nonRefundable", "true");
    else params.delete("nonRefundable");
    
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const clearCheckIn = () => { setCheckIn(""); setCheckOut(""); };
  const clearCheckOut = () => setCheckOut("");

  const handleReserve = () => {
    if (hasBooking) {
      const params = new URLSearchParams({
        listing: listing.id,
        checkIn: checkIn,
        checkOut: checkOut,
        guests: String(totalGuests)
      });
      if (nonRefundable) params.append("nonRefundable", "true");
      router.push(`/checkout?${params.toString()}`);
    } else {
      setCalendarOpen(true);
    }
  };

  // ── INLINE CALENDAR (main content column) ────────────────────────────────
  const calendarSection = (
    <AvailabilityCalendar
      blockedDates={listing.blockedDates || []}
      checkIn={checkIn}
      checkOut={checkOut}
      onCheckInChange={handleCheckInChange}
      onCheckOutChange={handleCheckOutChange}
      minNights={listing.minNights}
      calendarMinStays={listing.calendarMinStays || {}}
    />
  );

  const sidebarCard = (
    <div className="flex flex-col gap-4 relative">

      {!isCheckout && hasBooking && unlocksNewDiscount && (
        <div className="relative rounded-[16px] bg-white border border-slate-100 shadow-[0_8px_30px_rgba(12,25,41,0.08)] px-5 py-4 flex items-start gap-4">
          <div className="relative shrink-0 pt-0.5">
            <Tag className="h-6 w-6 text-emerald-600 fill-emerald-500" />
          </div>
          <div className="flex flex-col">
            <p className="text-[15px] font-semibold text-[#0c1929] tracking-tight">Add a night for {formatCurrency(extensionPriceDiff)}</p>
            <p className="text-[13px] text-[#0c1929] mt-0.5">
              Extend to {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(new Date(checkOut).setDate(new Date(checkOut).getDate() + 1)))} with this special offer.
            </p>
            <button 
              onClick={() => {
                const nextDay = new Date(checkOut);
                nextDay.setDate(nextDay.getDate() + 1);
                setCheckOut(nextDay.toISOString().split("T")[0]);
              }} 
              className="mt-1 w-max text-left text-[14px] font-semibold text-[#0c1929] underline decoration-[#0c1929] underline-offset-2 hover:text-[#0c1929] transition"
            >
              Add 1 night
            </button>
          </div>
        </div>
      )}

      {/* Main sidebar card */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-7 md:p-8 shadow-[0_8px_40px_rgba(12,25,41,0.04)]">

      {/* Checkout-only Header Thumbnail */}
      {isCheckout && (
        <div className="mb-6 flex gap-4 border-b border-slate-100 pb-6">
          <div className="relative h-[84px] w-[104px] shrink-0 overflow-hidden rounded-xl border border-slate-100">
            <Image src={listing.images[0]} alt={listing.title} fill sizes="104px" className="object-cover" />
          </div>
          <div className="flex flex-col mt-0.5">
            <h2 className="text-[17px] font-semibold leading-snug tracking-tight line-clamp-2">{listing.title}</h2>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-medium tracking-tight text-[#0c1929]">
              {listing.neighborhood || listing.location || "Toronto, Canada"}
            </div>
          </div>
        </div>
      )}

      {/* Price header */}
      <div className="mb-5">
        {hasBooking ? (
          <>
            <div className={`relative group inline-block ${isCheckout ? "" : "cursor-help"} w-full`}>
              <h2 className={`text-[22px] font-semibold text-[#0c1929] ${isCheckout ? "" : "underline decoration-[#0c1929] underline-offset-2"}`}>
                {formatCurrency(displayedTotal)} total
              </h2>

              {/* Tooltip vs Inline Breakdown */}
              <div className={`transition-all duration-200 ${isCheckout ? "mt-4 block" : "invisible absolute top-full left-0 mt-3 w-max min-w-[280px] z-50 opacity-0 group-hover:visible group-hover:opacity-100"}`}>
                <div className={`${isCheckout ? "" : "rounded-2xl bg-white p-5 shadow-[0_10px_40px_rgba(12,25,41,0.2)] ring-1 ring-slate-200"} text-sm font-normal text-[#0c1929] space-y-3 cursor-default`}>
                  <div className="flex items-center justify-between gap-6">
                    <span>{formatCurrency(breakdown.avgNightlyRate)} × {breakdown.nights} night{breakdown.nights !== 1 ? "s" : ""}</span>
                    <span className={breakdown.discountAmount > 0 ? "text-[#0c1929]" : ""}>{formatCurrency(breakdown.nightlySubtotal)}</span>
                  </div>
                  {breakdown.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 font-medium gap-6">
                      <span>{breakdown.discountPercentage}% {breakdown.discountCaption || "Long Stay Discount"}</span>
                      <span>-{formatCurrency(breakdown.discountAmount)}</span>
                    </div>
                  )}
                  {breakdown.directBookingDiscountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 font-medium gap-6">
                      <span>{breakdown.directBookingDiscountPercentage}% {breakdown.directBookingDiscountCaption}</span>
                      <span>-{formatCurrency(breakdown.directBookingDiscountAmount)}</span>
                    </div>
                  )}
                  {nonRefundable && nonRefundableAmount > 0 && activeCancellationPolicy && (
                    <div className="flex items-center justify-between text-emerald-600 font-medium gap-6">
                      <span>{activeCancellationPolicy.nonRefundableDiscountPercentage}% Non-refundable Discount</span>
                      <span>-{formatCurrency(nonRefundableAmount)}</span>
                    </div>
                  )}
                  {breakdown.cleaningFee > 0 && (
                    <div className="flex items-center justify-between gap-6">
                      <span>Cleaning fee</span>
                      <span>{formatCurrency(breakdown.cleaningFee)}</span>
                    </div>
                  )}
                  {breakdown.serviceFee > 0 && (
                    <div className="flex items-center justify-between gap-6">
                      <span>Service fee</span>
                      <span>{formatCurrency(breakdown.serviceFee)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-6">
                    <span>Taxes</span>
                    <span>{formatCurrency(breakdown.taxes)}</span>
                  </div>
                  {!isCheckout && (
                    <div className="flex items-center justify-between font-semibold text-[#0c1929] text-[15px] pt-1 gap-6">
                      <span>Total before taxes</span>
                      <span>{formatCurrency(displayedTotal)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {!isCheckout && (breakdown.discountAmount > 0 || breakdown.directBookingDiscountAmount > 0 || (nonRefundable && nonRefundableAmount > 0)) && (
              <div className="mt-0.5 flex flex-col gap-0.5 text-[14px] text-emerald-600">
                {breakdown.discountAmount > 0 && (
                  <p>{breakdown.discountPercentage}% {breakdown.discountCaption || "Long Stay Discount"}</p>
                )}
                {breakdown.directBookingDiscountAmount > 0 && (
                  <p>{breakdown.directBookingDiscountPercentage}% {breakdown.directBookingDiscountCaption}</p>
                )}
                {nonRefundable && nonRefundableAmount > 0 && activeCancellationPolicy && (
                  <p>{activeCancellationPolicy.nonRefundableDiscountPercentage}% Non-refundable Discount applied</p>
                )}
              </div>
            )}
          </>
        ) : (
          <h2 className="text-[20px] font-semibold text-[#0c1929]">Add dates for prices</h2>
        )}
      </div>

      {/* CHECK-IN / CHECKOUT table */}
      <div className="rounded-[12px] border border-slate-300 overflow-hidden">
        <div className="flex divide-x divide-slate-300 border-b border-slate-300">
          {/* Check-in cell */}
          <div
            onClick={() => setCalendarOpen(true)}
            className="flex-1 px-3 py-3 text-left hover:bg-slate-50 transition group cursor-pointer"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#0c1929]">Check-in</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className={`text-sm ${checkIn ? "text-[#0c1929] font-medium" : "text-[#0c1929]"}`}>
                {checkIn ? formatIso(checkIn) : "Add date"}
              </p>
              {checkIn && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearCheckIn(); }}
                  className="ml-1 rounded-full p-0.5 hover:bg-slate-200 text-[#0c1929] hover:text-[#0c1929] transition"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Checkout cell */}
          <div
            onClick={() => setCalendarOpen(true)}
            className="flex-1 px-3 py-3 text-left hover:bg-slate-50 transition cursor-pointer"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#0c1929]">Checkout</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className={`text-sm ${checkOut ? "text-[#0c1929] font-medium" : "text-[#0c1929]"}`}>
                {checkOut ? formatIso(checkOut) : "Add date"}
              </p>
              {checkOut && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearCheckOut(); }}
                  className="ml-1 rounded-full p-0.5 hover:bg-slate-200 text-[#0c1929] hover:text-[#0c1929] transition"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Guests row — opens popup below */}
        <div className="relative rounded-b-[12px]">
          <button
            ref={guestBtnRef}
            onClick={() => {
              if (!guestOpen && guestBtnRef.current) {
                const rect = guestBtnRef.current.getBoundingClientRect();
                setGuestPopupStyle({
                  top: rect.bottom + 6,
                  left: rect.left,
                  width: rect.width,
                });
              }
              setGuestOpen(!guestOpen);
            }}
            className={`w-full px-3 py-3 text-left hover:bg-slate-50 transition flex items-center justify-between rounded-b-[12px] ${guestOpen ? "ring-2 ring-[#0c1929] ring-inset" : ""}`}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#0c1929]">Guests</p>
              <p className="mt-0.5 text-sm text-[#0c1929] font-medium">
                {totalGuests} guest{totalGuests !== 1 ? "s" : ""}
                {infants > 0 ? `, ${infants} infant${infants !== 1 ? "s" : ""}` : ""}
                {pets > 0 ? `, ${pets} pet${pets !== 1 ? "s" : ""}` : ""}
              </p>
            </div>
            <ChevronDown className={`h-4 w-4 text-[#0c1929] transition-transform ${guestOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Click-away backdrop */}
          {guestOpen && mountedPortal && createPortal(
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setGuestOpen(false)} />
              <div
                style={guestPopupStyle}
                className="fixed z-[9999] w-[320px] rounded-[16px] bg-white shadow-[0_8px_40px_rgba(12,25,41,0.18)] ring-1 ring-slate-200 px-4 pt-2 pb-4"
              >
                <GuestRow label="Adults" sublabel="Age 13+" value={adults} onDecrement={() => setAdults(Math.max(1, adults - 1))} onIncrement={() => setAdults(Math.min(maxGuests - children, adults + 1))} canDecrement={adults > 1} canIncrement={adults + children < maxGuests} />
                <GuestRow label="Children" sublabel="Ages 2–12" value={children} onDecrement={() => setChildren(Math.max(0, children - 1))} onIncrement={() => setChildren(Math.min(maxGuests - adults, children + 1))} canDecrement={children > 0} canIncrement={adults + children < maxGuests} />
                <GuestRow label="Infants" sublabel="Under 2" value={infants} onDecrement={() => setInfants(Math.max(0, infants - 1))} onIncrement={() => setInfants(infants + 1)} canDecrement={infants > 0} canIncrement={true} />
                <GuestRow label="Pets" sublabel={<span className="underline cursor-pointer">Bringing a service animal?</span>} value={pets} onDecrement={() => setPets(Math.max(0, pets - 1))} onIncrement={() => setPets(pets + 1)} canDecrement={pets > 0} canIncrement={true} />
                <p className="mt-4 text-xs text-[#0c1929] leading-5 border-t border-slate-100 pt-3">
                  This place has a maximum of {maxGuests} guests, not including infants. Pets aren&apos;t allowed.
                </p>
                <div className="mt-3 flex justify-end">
                  <button onClick={() => setGuestOpen(false)} className="text-sm font-semibold text-[#0c1929] underline hover:text-[#0c1929] transition">Close</button>
                </div>
              </div>
            </>,
            document.body
          )}
        </div>
      </div>



      {/* Cancellation Policy Box & Radio Buttons */}
      {checkIn && (
        <div className="mt-4 flex flex-col gap-3">
          {activeCancellationPolicy?.offerNonRefundableDiscount ? (
             <div className="rounded-[16px] border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white">
                <label className={`flex items-start gap-3 p-4 cursor-pointer transition ${!nonRefundable ? "bg-slate-50" : ""}`}>
                  <input type="radio" name="refundability" className="mt-1 w-4 h-4 text-[#0c1929]" checked={!nonRefundable} onChange={() => { setNonRefundable(false); updateUrlParams(checkIn, checkOut, false); if(typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('syncNonRefundable', { detail: false })); }} />
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#0c1929] text-[15px]">Standard: {formatCurrency(standardBreakdown.total)}</span>
                    <span className="text-sm text-[#0c1929] mt-1">{cancellationText}</span>
                    {partialCancellationText && <span className="text-sm text-[#0c1929] font-medium mt-0.5">{partialCancellationText}</span>}
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-4 cursor-pointer transition ${nonRefundable ? "bg-slate-50" : ""}`}>
                  <input type="radio" name="refundability" className="mt-1 w-4 h-4 text-[#0c1929]" checked={nonRefundable} onChange={() => { setNonRefundable(true); updateUrlParams(checkIn, checkOut, true); if(typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('syncNonRefundable', { detail: true })); }} />
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#0c1929] text-[15px]">Non-refundable: {formatCurrency(nonRefBreakdown.total)}</span>
                    <span className="text-sm text-[#0c1929] mt-1">Save {nonRefBreakdown.nonRefundableDiscountPercentage}% but cancel without a refund.</span>
                  </div>
                </label>
             </div>
          ) : (
            <div className="text-center text-sm font-semibold text-[#0c1929] mt-2 mb-1 px-2">
              <span className="font-semibold text-[15px]">{cancellationText}</span>
              {partialCancellationText && <div className="text-[14px] font-normal mt-1">{partialCancellationText}</div>}
            </div>
          )}


        </div>
      )}

      {/* CTA Button */}
      {!isCheckout && (
        <button
          ref={reserveBtnRef}
          onClick={handleReserve}
          disabled={!hasBooking}
          className="mt-6 w-full rounded-full bg-gradient-to-r from-[#0c1929] to-[#152b47] py-4 text-[15px] font-bold tracking-wide text-white shadow-[0_8px_20px_rgba(12,25,41,0.2)] transition hover:from-[#152b47] hover:to-[#0c1929] active:scale-[0.98] disabled:opacity-50"
        >
          {hasBooking ? "Reserve" : "Check availability"}
        </button>
      )}

      {hasBooking && (
        <p className="mt-3 text-center text-sm text-[#0c1929]">You won&apos;t be charged yet</p>
      )}

      </div>

      {/* External Discount Banner below card */}
      {isCheckout && hasBooking && breakdown && (breakdown.totalDiscountAmount > 0) && (
        <div className="rounded-[20px] bg-[#f0f9f3] text-[#1b5e20] py-5 px-6 flex items-center justify-start font-semibold text-[15px] mt-2 border border-emerald-100">
          <Tag className="w-5 h-5 mr-3 fill-[#4caf50] text-[#388e3c]" /> 
          {formatCurrency(breakdown.totalDiscountAmount)} CAD discount applied
        </div>
      )}


    </div>
  );

  // ── CALENDAR POPUP over the listing area when triggered from sidebar ──────
  const calendarPopup = calendarOpen && mountedPortal ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[80px] px-4 bg-[#0c1929]/30">
      <div className="absolute inset-0" onClick={() => setCalendarOpen(false)} />
      <div className="relative w-full max-w-[860px] rounded-[24px] bg-white shadow-2xl ring-1 ring-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top bar with date fields and Close */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b border-slate-200 px-6 py-4">
          {hasBooking && (
            <div className="text-left hidden sm:block mr-4">
              <p className="text-lg font-bold text-[#0c1929]">{breakdown.nights} night{breakdown.nights !== 1 ? "s" : ""}</p>
              <p className="text-xs text-[#0c1929]">{formatNightLabel(checkIn, checkOut)}</p>
            </div>
          )}
          <div className="flex flex-1 rounded-[10px] border border-slate-300 overflow-hidden divide-x divide-slate-300">
            <div className="flex-1 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#0c1929]">Check-in</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#0c1929]">{checkIn || "Add date"}</p>
                {checkIn && <button onClick={clearCheckIn} className="text-[#0c1929] hover:text-[#0c1929]"><X className="h-3.5 w-3.5" /></button>}
              </div>
            </div>
            <div className="flex-1 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#0c1929]">Checkout</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#0c1929]">{checkOut || "Add date"}</p>
                {checkOut && <button onClick={clearCheckOut} className="text-[#0c1929] hover:text-[#0c1929]"><X className="h-3.5 w-3.5" /></button>}
              </div>
            </div>
          </div>
          <button
            onClick={() => setCalendarOpen(false)}
            className="rounded-xl bg-[#0c1929] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c1929] transition shrink-0"
          >
            Close
          </button>
        </div>
        {/* Calendar */}
        <div className="p-6">
          <AvailabilityCalendar
            blockedDates={listing.blockedDates || []}
            checkIn={checkIn}
            checkOut={checkOut}
            onCheckInChange={handleCheckInChange}
            onCheckOutChange={handleCheckOutChange}
            minNights={listing.minNights}
            calendarMinStays={listing.calendarMinStays || {}}
          />
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="contents">
      {/* Inline calendar in the content column */}
      {!isCheckout && (
        <div className="mb-4">
          {calendarSection}
        </div>
      )}

      {/* Sidebar via Portal or Inline */}
      {(layout === "both" || layout === "desktop") && (
        isCheckout ? (
          <div className="hidden lg:block">{sidebarCard}</div>
        ) : (
          mountedPortal && (() => {
            const target = document.getElementById("listing-booking-sidebar");
            if (!target) return null;
            return createPortal(<div className="hidden lg:block">{sidebarCard}</div>, target);
          })()
        )
      )}

      {/* Mobile Sticky Bottom Bar */}
      {!isCheckout && mountedPortal && (layout === "both" || layout === "mobile") && createPortal(
        <div className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden items-center justify-between border-t border-slate-200 bg-white px-5 py-4 shadow-[0_-8px_20px_rgba(12,25,41,0.05)] pb-safe">
          <button onClick={() => { if (hasBooking) setPriceSheetOpen(true); }} className="flex flex-col items-start text-left">
            <span className={`text-[17px] font-bold text-[#0c1929] ${hasBooking ? "underline decoration-[#0c1929] underline-offset-2" : ""}`}>
              {formatCurrency(displayedTotal)} total
            </span>
            <span className="text-sm font-semibold text-emerald-600">
               {hasBooking ? `${breakdown.nights} nights` : "Add dates"}
            </span>
          </button>
          <button
            onClick={() => {
              if (hasBooking) handleReserve();
              else setMobileSheetOpen(true);
            }}
            className="rounded-full bg-[#0c1929] px-8 py-3.5 text-sm font-bold text-white shadow-lg transition active:scale-[0.98]"
          >
            {hasBooking ? "Reserve" : "Check availability"}
          </button>
        </div>,
        document.body
      )}

      {/* Mobile Price Details Sheet Modal */}
      {!isCheckout && (priceSheetOpen || closingPriceSheet) && mountedPortal && (layout === "both" || layout === "mobile") && createPortal(
        <>
          <div className={`fixed inset-0 bg-[#0c1929]/40 z-[9998] lg:hidden ${closingPriceSheet ? "mobile-backdrop-close" : "mobile-backdrop-animate"}`} onClick={handleClosePriceSheet} />
          <div className={`fixed inset-x-0 bottom-0 top-[120px] z-[9999] lg:hidden bg-white flex flex-col rounded-t-[24px] ${closingPriceSheet ? "mobile-modal-close" : "mobile-modal-animate"}`}>
            <div className="flex justify-start px-4 pt-4 mb-2">
              <button type="button" onClick={handleClosePriceSheet} className="p-2 rounded-full hover:bg-slate-100 transition">
                <X className="h-5 w-5 text-[#0c1929]" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 pb-32 hide-scrollbar">
              <h2 className="text-[24px] font-bold text-[#0c1929] mb-6">Price details</h2>
              
              <div className="space-y-4 text-[15px] text-[#0c1929]">
                <div className="flex justify-between items-center">
                  <span>{breakdown.nights} nights x {formatCurrency(breakdown.avgNightlyRate)} CAD</span>
                  <span>{formatCurrency(breakdown.nightlySubtotal)} CAD</span>
                </div>
                {breakdown.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>{breakdown.discountPercentage}% {breakdown.discountCaption || "Discount"}</span>
                    <span>-{formatCurrency(breakdown.discountAmount)} CAD</span>
                  </div>
                )}
                {breakdown.directBookingDiscountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>{breakdown.directBookingDiscountPercentage}% {breakdown.directBookingDiscountCaption}</span>
                    <span>-{formatCurrency(breakdown.directBookingDiscountAmount)} CAD</span>
                  </div>
                )}
                {nonRefundable && nonRefundableAmount > 0 && activeCancellationPolicy && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>{activeCancellationPolicy.nonRefundableDiscountPercentage}% Non-refundable</span>
                    <span>-{formatCurrency(nonRefundableAmount)} CAD</span>
                  </div>
                )}
                {breakdown.cleaningFee > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Cleaning fee</span>
                    <span>{formatCurrency(breakdown.cleaningFee)} CAD</span>
                  </div>
                )}
                {breakdown.serviceFee > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Service fee</span>
                    <span>{formatCurrency(breakdown.serviceFee)} CAD</span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <span>Taxes</span>
                  <span>{formatCurrency(breakdown.taxes)} CAD</span>
                </div>
                <div className="flex justify-between items-center font-bold text-[17px] pt-1">
                  <span>Total</span>
                  <span>{formatCurrency(displayedTotal)} CAD</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 flex items-start justify-between">
                <div>
                  <h3 className="text-[17px] font-bold text-[#0c1929] mb-1">Dates</h3>
                  <p className="text-[15px] text-[#0c1929] font-medium">{formatNightLabel(checkIn, checkOut)}</p>
                  <p className="text-[13px] text-slate-500 mt-0.5">{cancellationText}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => { handleClosePriceSheet(); setTimeout(() => setMobileSheetOpen(true), 150); }}
                  className="rounded-[10px] bg-slate-100 px-4 py-2 text-[14px] font-semibold text-[#0c1929] transition hover:bg-slate-200"
                >
                  Change
                </button>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-10 rounded-t-[24px] shadow-[0_-4px_20px_rgba(12,25,41,0.05)] pb-safe">
              <button 
                type="button" 
                onClick={(e) => { handleClosePriceSheet(); handleReserve(e); }} 
                className="w-full rounded-full bg-[#0c1929] py-4 text-base font-bold text-white shadow-lg transition active:scale-[0.98]"
              >
                Reserve
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Mobile Booking Sheet Modal */}
      {!isCheckout && (mobileSheetOpen || closingPanel) && mountedPortal && (layout === "both" || layout === "mobile") && createPortal(
        <>
          <div className={`fixed inset-0 bg-[#0c1929]/40 z-[9998] lg:hidden ${closingPanel ? "mobile-backdrop-close" : "mobile-backdrop-animate"}`} onClick={handleClosePanel} />
          <div className={`fixed inset-x-0 bottom-0 top-[100px] z-[9999] lg:hidden bg-white flex flex-col rounded-t-[32px] ${closingPanel ? "mobile-modal-close" : "mobile-modal-animate"}`}>
             <div className="flex-1 overflow-y-auto p-0 pb-32">
               <div className="flex justify-between items-center px-5 pt-6 mb-4">
                 <h2 className="text-xl font-bold">Book your stay</h2>
                 <button type="button" onClick={handleClosePanel} className="p-2 rounded-full hover:bg-slate-100 transition bg-slate-50">
                   <X className="h-5 w-5" />
                 </button>
               </div>
               
               <div className="mb-6 px-4 sm:px-5">
                 <div className="rounded-[24px] border border-slate-100 p-2 sm:p-4 shadow-sm">
                   {/* Remove header from calendar for mobile sheet to match main page */}
                   <AvailabilityCalendar
                     blockedDates={listing.blockedDates || []}
                     checkIn={checkIn}
                     checkOut={checkOut}
                     onCheckInChange={handleCheckInChange}
                     onCheckOutChange={handleCheckOutChange}
                     minNights={listing.minNights}
                     calendarMinStays={listing.calendarMinStays || {}}
                     showHeader={false}
                   />
                 </div>
               </div>

               <div className="mb-6 px-5">
                 <div className="rounded-[24px] border border-slate-200 p-3 shadow-sm">
                   <GuestRow label="Adults" sublabel="Age 13+" value={adults} onDecrement={() => setAdults(Math.max(1, adults - 1))} onIncrement={() => setAdults(Math.min(maxGuests - children, adults + 1))} canDecrement={adults > 1} canIncrement={adults + children < maxGuests} />
                   <div className="w-full border-b border-slate-100 my-2" />
                   <GuestRow label="Children" sublabel="Ages 2–12" value={children} onDecrement={() => setChildren(Math.max(0, children - 1))} onIncrement={() => setChildren(Math.min(maxGuests - adults, children + 1))} canDecrement={children > 0} canIncrement={adults + children < maxGuests} />
                   <div className="w-full border-b border-slate-100 my-2" />
                   <GuestRow label="Infants" sublabel="Under 2" value={infants} onDecrement={() => setInfants(Math.max(0, infants - 1))} onIncrement={() => setInfants(infants + 1)} canDecrement={infants > 0} canIncrement={true} />
                   <div className="w-full border-b border-slate-100 my-2" />
                   <GuestRow label="Pets" sublabel="Service animals aren't pets" value={pets} onDecrement={() => setPets(Math.max(0, pets - 1))} onIncrement={() => setPets(pets + 1)} canDecrement={pets > 0} canIncrement={true} />
                 </div>
               </div>

               {/* Mobile Cancellation Policy & Pricing Summary */}
               {checkIn && (
                 <div className="mb-6 px-5">
                   {activeCancellationPolicy?.offerNonRefundableDiscount ? (
                     <div className="rounded-[24px] border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
                        <label className={`flex items-start gap-3 p-4 cursor-pointer transition ${!nonRefundable ? "bg-slate-50" : ""}`}>
                          <input type="radio" name="mobile-refundability" className="mt-1 w-4 h-4 text-[#0c1929]" checked={!nonRefundable} onChange={() => { setNonRefundable(false); updateUrlParams(checkIn, checkOut, false); if(typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('syncNonRefundable', { detail: false })); }} />
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#0c1929] text-[15px]">Standard: {formatCurrency(standardBreakdown.total)}</span>
                            <span className="text-sm text-[#0c1929] mt-1">{cancellationText}</span>
                            {partialCancellationText && <span className="text-sm text-[#0c1929] font-medium mt-0.5">{partialCancellationText}</span>}
                          </div>
                        </label>
                        <label className={`flex items-start gap-3 p-4 cursor-pointer transition ${nonRefundable ? "bg-slate-50" : ""}`}>
                          <input type="radio" name="mobile-refundability" className="mt-1 w-4 h-4 text-[#0c1929]" checked={nonRefundable} onChange={() => { setNonRefundable(true); updateUrlParams(checkIn, checkOut, true); if(typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('syncNonRefundable', { detail: true })); }} />
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#0c1929] text-[15px]">Non-refundable: {formatCurrency(nonRefBreakdown.total)}</span>
                            <span className="text-sm text-[#0c1929] mt-1">Save {nonRefBreakdown.nonRefundableDiscountPercentage}% but cancel without a refund.</span>
                          </div>
                        </label>
                     </div>
                   ) : (
                     <div className="rounded-[24px] border border-slate-200 p-4 bg-slate-50 shadow-sm text-sm text-[#0c1929]">
                       <span className="font-semibold text-[15px] block mb-1">{cancellationText}</span>
                       {partialCancellationText && <span className="block mt-1">{partialCancellationText}</span>}
                     </div>
                   )}
                 </div>
               )}
             </div>

             {/* Sticky Bottom Action Bar inside the sheet */}
             <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-between items-center z-10 rounded-t-[24px] shadow-[0_-4px_20px_rgba(12,25,41,0.05)] pb-safe">
               <button type="button" onClick={() => { setCheckIn(""); setCheckOut(""); }} className="text-base font-semibold underline decoration-2 underline-offset-2">
                 Clear dates
               </button>
               <button 
                 type="button" 
                 disabled={!hasBooking}
                 onClick={() => handleClosePanel()} 
                 className="rounded-full bg-[#0c1929] px-8 py-4 text-base font-bold text-white shadow-lg transition flex items-center gap-2 hover:scale-[1.02] disabled:opacity-50"
               >
                 Apply
               </button>
             </div>
          </div>
        </>,
        document.body
      )}

      {/* Calendar popup (Desktop) */}
      {(layout === "both" || layout === "desktop") && (
        <div className="hidden lg:block">
          {calendarPopup}
        </div>
      )}
    </div>
  );
}

// ── Guest row sub-component ───────────────────────────────────────────────────
function GuestRow({ label, sublabel, value, onDecrement, onIncrement, canDecrement, canIncrement }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <h4 className="font-semibold text-[#0c1929]">{label}</h4>
        <p className="text-sm text-[#0c1929]">{sublabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onDecrement}
          disabled={!canDecrement}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-[#0c1929] hover:border-[#0c1929] hover:text-[#0c1929] disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-4 text-center text-base">{value}</span>
        <button
          onClick={onIncrement}
          disabled={!canIncrement}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-[#0c1929] hover:border-[#0c1929] hover:text-[#0c1929] disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
