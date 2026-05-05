"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function AvailabilityCalendar({ blockedDates = [], partiallyBlockedDates = [], allListingsBlocked = [], checkIn, checkOut, onCheckInChange, onCheckOutChange, minNights = 2, calendarMinStays = {}, showHeader = true, showClearDates = true, onClose }) {
  const initDate = checkIn ? new Date(checkIn) : new Date();
  // Ensure we start at the first of the month
  const [viewDate, setViewDate] = useState(new Date(initDate.getFullYear(), initDate.getMonth(), 1));

  const [internalCheckIn, setInternalCheckIn] = useState(checkIn || null);
  const [internalCheckOut, setInternalCheckOut] = useState(checkOut || null);
  const [selectionStep, setSelectionStep] = useState(checkOut ? "done" : "checkIn");

  useEffect(() => {
    setInternalCheckIn(checkIn || null);
    setInternalCheckOut(checkOut || null);
    if (!checkIn && !checkOut) setSelectionStep("checkIn");
    else if (checkIn && checkOut) setSelectionStep("done");
    else if (checkIn && !checkOut) setSelectionStep("checkOut");
  }, [checkIn, checkOut]);

  const blockedSet = new Set(blockedDates);
  const partialSet = new Set(partiallyBlockedDates);
  const sortedBlockedDates = useMemo(() => [...blockedDates].sort(), [blockedDates]);

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  }, []);

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const handleDateClick = (iso) => {
    const isBoundaryCheckoutDate = Boolean(selectionStep === "checkOut" && nextBlockedAfterCheckIn && iso === nextBlockedAfterCheckIn);

    if ((blockedSet.has(iso) && !isBoundaryCheckoutDate) || iso < todayStr) return;

    if (selectionStep === "checkIn" || selectionStep === "done") {
      setInternalCheckIn(iso);
      setInternalCheckOut(null);
      setSelectionStep("checkOut");
      if (onCheckInChange) onCheckInChange(iso);
      if (onCheckOutChange) onCheckOutChange(null);
    } else {
      // Rule: cannot jump past a blocked date
      if (nextBlockedAfterCheckIn && iso > nextBlockedAfterCheckIn) return;
      if (iso <= internalCheckIn) {
        setInternalCheckIn(iso);
        if (onCheckInChange) onCheckInChange(iso);
        return;
      }
      setInternalCheckOut(iso);
      setSelectionStep("done");
      if (onCheckOutChange) onCheckOutChange(iso);
    }
  };

  const clearDates = () => {
    setInternalCheckIn(null);
    setInternalCheckOut(null);
    setSelectionStep("checkIn");
    if (onCheckInChange) onCheckInChange(null);
    if (onCheckOutChange) onCheckOutChange(null);
  };

  // Rule: find first blocked date strictly after the current checkIn
  // All dates on/after that boundary are disabled during checkout selection
  const nextBlockedAfterCheckIn = useMemo(() => {
    if (!internalCheckIn || selectionStep !== "checkOut") return null;
    return sortedBlockedDates.find((d) => d > internalCheckIn) || null;
  }, [internalCheckIn, selectionStep, sortedBlockedDates]);

  const activeMinNights = useMemo(() => {
    if (!internalCheckIn) return minNights;
    return calendarMinStays[internalCheckIn] || minNights;
  }, [internalCheckIn, minNights, calendarMinStays]);

  const minCheckOutBoundary = useMemo(() => {
    if (!internalCheckIn || selectionStep !== "checkOut") return null;
    const [year, month, day] = internalCheckIn.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + activeMinNights);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, [internalCheckIn, selectionStep, activeMinNights]);

  // For each listing, find the first blocked date >= checkIn.
  // A checkout date `d` is valid if at least one listing has no blocked date in [checkIn, d).
  // For listing i, the max valid checkout = first blocked date >= checkIn (since checkout ON that date is fine).
  // Dates beyond that are invalid for that listing.
  // A checkout date is globally invalid only if ALL listings have their limit < d.
  const listingCheckoutLimits = useMemo(() => {
    if (!internalCheckIn || selectionStep !== "checkOut" || allListingsBlocked.length === 0) return null;
    return allListingsBlocked.map(dates => {
      const sorted = [...dates].sort();
      return sorted.find(d => d >= internalCheckIn) || null; // null = unlimited
    });
  }, [internalCheckIn, selectionStep, allListingsBlocked]);

  const generateGrid = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let index = 0; index < firstDay; index += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }
    return cells;
  };

  const leftYear = viewDate.getFullYear();
  const leftMonth = viewDate.getMonth();
  const leftLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(leftYear, leftMonth, 1));
  const leftCells = generateGrid(leftYear, leftMonth);

  const rightDate = new Date(leftYear, leftMonth + 1, 1);
  const rightYear = rightDate.getFullYear();
  const rightMonth = rightDate.getMonth();
  const rightLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(rightDate);
  const rightCells = generateGrid(rightYear, rightMonth);

  const renderCell = (cell, index) => {
    if (!cell) {
      return <div key={`empty-${index}`} className="flex h-12 w-12 items-center justify-center bg-transparent" />;
    }

    const currentYear = cell.getFullYear();
    const currentMonth = String(cell.getMonth() + 1).padStart(2, "0");
    const currentDate = String(cell.getDate()).padStart(2, "0");
    const iso = `${currentYear}-${currentMonth}-${currentDate}`;

    const isPast = iso < todayStr;
    const isActuallyBlocked = blockedSet.has(iso) || isPast;

    // The start of a blocked period can still be used as a checkout date for the previous guest.
    const isBoundaryCheckoutDate = Boolean(selectionStep === "checkOut" && nextBlockedAfterCheckIn && iso === nextBlockedAfterCheckIn);

    const isBlocked = isActuallyBlocked && !isBoundaryCheckoutDate;

    // During checkout selection, dates STRICTLY AFTER the next blocked date are disabled
    const isBeyondBoundary = Boolean(
      nextBlockedAfterCheckIn && iso > nextBlockedAfterCheckIn && selectionStep === "checkOut"
    );
    const isBeforeMinNights = Boolean(
      minCheckOutBoundary && iso > internalCheckIn && iso < minCheckOutBoundary && selectionStep === "checkOut"
    );

    // If picking a checkin date, verify there is at least a cellMinNights gap before the next blocked date
    let isUnbookableGap = false;
    let cellMinNights = calendarMinStays[iso] || minNights;
    if (!isBlocked && (selectionStep === "checkIn" || selectionStep === "done")) {
      const nextBlocked = sortedBlockedDates.find(d => d > iso);
      if (nextBlocked) {
        const d1 = new Date(iso + "T12:00:00");
        const d2 = new Date(nextBlocked + "T12:00:00");
        const diffNights = Math.round((d2 - d1) / 86400000);
        if (diffNights < cellMinNights) {
          isUnbookableGap = true;
        }
      }
    }

    let isSelected = false;
    let isInRange = false;

    if (internalCheckIn && internalCheckOut) {
      isSelected = iso === internalCheckIn || iso === internalCheckOut;
      isInRange = iso > internalCheckIn && iso < internalCheckOut;
    } else if (internalCheckIn) {
      isSelected = iso === internalCheckIn;
    }

    // Smart checkout validation: disable dates where no listing would be available
    // A checkout date d is valid if at least one listing has limit === null OR limit >= d
    const isNoListingForCheckout = Boolean(
      selectionStep === "checkOut" &&
      iso > internalCheckIn &&
      listingCheckoutLimits &&
      !listingCheckoutLimits.some(limit => limit === null || limit >= iso)
    );

    const isBookedStyle = isBlocked || isBeyondBoundary;
    const isConstraintStyle = !isBookedStyle && (isBeforeMinNights || isUnbookableGap || isNoListingForCheckout);
    const isDisabled = isBookedStyle || isConstraintStyle;

    const activeMinNightsForDisplay = selectionStep === "checkOut" ? activeMinNights : cellMinNights;

    const tooltipText = isUnbookableGap || isBeforeMinNights
      ? `${activeMinNightsForDisplay}-night minimum`
      : isNoListingForCheckout
        ? "No listing available for this range"
        : (isBookedStyle && !isPast) ? "No listing available"
        : null;

    const isPartial = !isBookedStyle && !isPast && partialSet.has(iso);

    const isStartOfRange = internalCheckIn && internalCheckOut && iso === internalCheckIn;
    const isEndOfRange = internalCheckIn && internalCheckOut && iso === internalCheckOut;

    return (
      <div key={iso} className="flex h-12 w-full justify-center relative group">
        {/* Seamless Range Backgrounds */}
        {isStartOfRange && (
          <div className="absolute top-0 right-0 h-full w-1/2 bg-[#0c1929]/10 z-0" />
        )}
        {isEndOfRange && (
          <div className="absolute top-0 left-0 h-full w-1/2 bg-[#0c1929]/10 z-0" />
        )}
        {isInRange && (
          <div className="absolute top-0 left-0 h-full w-full bg-[#0c1929]/10 z-0" />
        )}

        <button
          type="button"
          onClick={() => handleDateClick(iso)}
          disabled={isDisabled}
          className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold transition-all relative z-10 ${isSelected
            ? "bg-gradient-to-tr from-[#0c1929] to-[#152b47] text-white shadow-md shadow-[#0c1929]/30"
            : isInRange
              ? "text-[#152b47] w-full max-w-[48px]"
              : isBookedStyle
                ? "bg-transparent text-[#0c1929] opacity-25 line-through decoration-[#0c1929]/50 font-medium cursor-not-allowed"
                : isConstraintStyle
                  ? "bg-slate-100 text-[#0c1929] font-medium cursor-not-allowed border border-slate-200"
                  : "bg-transparent text-[#0c1929] hover:bg-slate-100 hover:text-[#0c1929] border border-transparent"
            }`}
        >
          {cell.getDate()}
        </button>
        {isDisabled && tooltipText && (
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 w-max bg-[#0c1929] text-white text-[11px] px-2.5 py-1.5 rounded-[8px] shadow-lg font-medium tracking-wide pointer-events-none before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-[#0c1929]">
            {tooltipText}
          </div>
        )}
        {isPartial && !isSelected && !isInRange && !isDisabled && (
          <>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-amber-400 z-20" />
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 w-max bg-[#0c1929] text-white text-[11px] px-2.5 py-1.5 rounded-[8px] shadow-lg font-medium tracking-wide pointer-events-none before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-[#0c1929]">
              Limited availability
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full rounded-[30px] bg-transparent p-7 md:p-8">
      {/* Header section identical to the image */}
      {showHeader && (
        <div className="mb-6">
          <h2 className="text-[22px] font-semibold tracking-tight text-[#0c1929]">
            Select check-in date
          </h2>
          <p className="mt-1 text-sm text-[#0c1929]">
            Add your travel dates for exact pricing
          </p>
        </div>
      )}

      {/* Double grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative pb-8">
        {/* Absolute chevron controllers overlaid spanning the grid structure per spec */}
        <button
          type="button"
          onClick={prevMonth}
          className="absolute left-0 top-[5px] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/50 border border-slate-200/40 shadow-sm hover:bg-white hover:shadow transition backdrop-blur-sm group"
        >
          <ChevronLeft className="h-5 w-5 text-[#0c1929] group-hover:text-[#0c1929] transition" />
        </button>
        <button
          type="button"
          onClick={nextMonth}
          className="absolute right-0 top-[5px] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/50 border border-slate-200/40 shadow-sm hover:bg-white hover:shadow transition backdrop-blur-sm group"
        >
          <ChevronRight className="h-5 w-5 text-[#0c1929] group-hover:text-[#0c1929] transition" />
        </button>

        {/* Left Grid */}
        <div>
          <h3 className="mb-10 text-center text-base font-semibold text-[#0c1929]">{leftLabel}</h3>
          <div className="mb-2 grid grid-cols-7 text-center text-[12px] font-bold text-[#0c1929]">
            {WEEK_DAYS.map((day, idx) => (
              <div key={`l-day-${idx}`}>{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {leftCells.map(renderCell)}
          </div>
        </div>

        {/* Right Grid */}
        <div className="hidden md:block">
          <h3 className="mb-6 text-center text-base font-semibold text-[#0c1929]">{rightLabel}</h3>
          <div className="mb-2 grid grid-cols-7 text-center text-[12px] font-bold text-[#0c1929]">
            {WEEK_DAYS.map((day, idx) => (
              <div key={`r-day-${idx}`}>{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {rightCells.map(renderCell)}
          </div>
        </div>
      </div>

      {/* Footer accessories mimicking the layout structure below the double grid */}
      <div className="flex items-center justify-between pt-2">
        {onClose ? (
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-200/50 text-[#0c1929] hover:text-[#0c1929] transition">
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        ) : (
          <div />
        )}

        {showClearDates ? (
          <button
            type="button"
            onClick={clearDates}
            className="text-sm font-semibold underline text-[#0c1929] hover:text-[#0c1929] px-3 py-2 rounded-xl hover:bg-slate-200/50 transition"
          >
            Clear dates
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
