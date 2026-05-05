"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, Minus, Plus, Search, Users, UserCircle2 } from "lucide-react";
import { buildBookingQuery, formatDateRange, normalizeBooking } from "@/lib/booking";
import EditableBookingSummary from "@/components/EditableBookingSummary";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import { createPortal } from "react-dom";

function startOfLocalDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toIsoLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromIsoLocal(value) {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function sameDay(left, right) {
  return left?.getFullYear() === right?.getFullYear() && left?.getMonth() === right?.getMonth() && left?.getDate() === right?.getDate();
}

function CalendarRangePicker({ monthCursor, onMonthChange, checkIn, checkOut, onDayClick }) {
  const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const firstWeekday = monthStart.getDay();
  const daysInMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();
  const checkInDate = fromIsoLocal(checkIn);
  const checkOutDate = fromIsoLocal(checkOut);
  const today = startOfLocalDay(new Date());

  const dayCells = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    dayCells.push(<div key={`blank-${i}`} className="h-10" />);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day);
    const isStart = checkInDate ? sameDay(checkInDate, date) : false;
    const isEnd = checkOutDate ? sameDay(checkOutDate, date) : false;
    const isInRange = checkInDate && checkOutDate && date > checkInDate && date < checkOutDate;
    const isPast = date < today;

    dayCells.push(
      <button
        key={day}
        type="button"
        disabled={isPast}
        onClick={() => onDayClick(date)}
        className={`h-10 rounded-xl text-sm transition ${isStart || isEnd
          ? "bg-[#0c1929] font-semibold text-white"
          : isInRange
            ? "bg-slate-200 text-[#0c1929]"
            : isPast
              ? "text-slate-300 cursor-not-allowed line-through decoration-slate-300 font-medium"
              : "text-[#0c1929] hover:bg-slate-100"
          }`}
      >
        {day}
      </button>,
    );
  }

  return (
    <div className="w-[330px] rounded-3xl bg-white p-2">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-[#0c1929] hover:bg-slate-50"
        >
          Prev
        </button>
        <p className="text-sm font-semibold text-[#0c1929]">
          {monthCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={() => onMonthChange(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-[#0c1929] hover:bg-slate-50"
        >
          Next
        </button>
      </div>
      <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0c1929]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayLabel) => (
          <span key={dayLabel}>{dayLabel}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{dayCells}</div>
      <p className="mt-3 text-xs text-[#0c1929]">Pick check-in first, then check-out. The popup closes after selecting the end date.</p>
    </div>
  );
}

function GuestRow({ label, sublabel, value, onDecrement, onIncrement, canDecrement, canIncrement }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <h4 className="font-semibold text-[#0c1929]">{label}</h4>
        <p className="text-sm text-[#0c1929]">{sublabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onDecrement} disabled={!canDecrement} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-[#0c1929] hover:border-[#0c1929] hover:text-[#0c1929] disabled:opacity-30 disabled:hover:border-slate-300 transition">
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-4 text-center text-base">{value}</span>
        <button type="button" onClick={onIncrement} disabled={!canIncrement} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-[#0c1929] hover:border-[#0c1929] hover:text-[#0c1929] disabled:opacity-30 disabled:hover:border-slate-300 transition">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DiscoverySearchForm({ booking, variant = "default" }) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(booking.checkIn);
  const [checkOut, setCheckOut] = useState(booking.checkOut);
  const [adults, setAdults] = useState(Number(booking.guests) || 1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef(null);
  const modalRef = useRef(null);
  const [openPanel, setOpenPanel] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => {
    const parsed = fromIsoLocal(booking.checkIn);
    return parsed ? new Date(parsed.getFullYear(), parsed.getMonth(), 1) : new Date();
  });

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        event.target &&
        document.contains(event.target) &&
        !formRef.current?.contains(event.target) &&
        !modalRef.current?.contains(event.target)
      ) {
        setOpenPanel(null);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpenPanel(null);
      }
    }

    setMounted(true);
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function formatFieldDate(value) {
    if (!value) {
      return "Add date";
    }
    const parsed = new Date(`${value}T00:00:00`);
    return parsed.toLocaleDateString(undefined, {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  }

  function formatDateRangeField() {
    if (!checkIn && !checkOut) {
      return "Add dates";
    }
    if (checkIn && !checkOut) {
      return `${formatFieldDate(checkIn)} - Add checkout`;
    }
    if (!checkIn && checkOut) {
      return `Add check-in - ${formatFieldDate(checkOut)}`;
    }
    return `${formatFieldDate(checkIn)} - ${formatFieldDate(checkOut)}`;
  }

  function getGuestLabel() {
    const total = adults + childrenCount;
    return `${total} guest${total !== 1 ? "s" : ""}`;
  }

  function handleSearch(event) {
    event.preventDefault();

    const nextBooking = {
      checkIn,
      checkOut,
      guests: adults + childrenCount,
    };

    startTransition(() => {
      router.push(`/?${new URLSearchParams(buildBookingQuery(nextBooking)).toString()}`);
    });
  }

  function toggleDatePanel() {
    setOpenPanel((current) => {
      if (current === "dates") {
        return null;
      }
      const initial = fromIsoLocal(checkIn) || new Date();
      setMonthCursor(new Date(initial.getFullYear(), initial.getMonth(), 1));
      return "dates";
    });
  }

  function handleCalendarDayClick(selectedDate) {
    const selectedDay = startOfLocalDay(selectedDate);
    const currentCheckIn = fromIsoLocal(checkIn);
    const currentCheckOut = fromIsoLocal(checkOut);

    if (!currentCheckIn || currentCheckOut) {
      setCheckIn(toIsoLocal(selectedDay));
      setCheckOut("");
      return;
    }

    if (selectedDay <= currentCheckIn) {
      setCheckIn(toIsoLocal(selectedDay));
      return;
    }

    setCheckOut(toIsoLocal(selectedDay));
  }

  if (variant === "pill") {
    return (
      <div ref={formRef} className="relative flex items-center rounded-full border border-slate-200 bg-white text-sm font-medium text-[#0c1929] shadow-sm transition hover:shadow-md">
        <button type="button" onClick={() => setOpenPanel(openPanel === "dates" ? null : "dates")} className={`px-4 py-2 rounded-l-full border-r border-slate-200 transition ${openPanel === "dates" ? "bg-slate-100 shadow-inner" : "hover:bg-slate-50"}`}>
          {formatDateRangeField()}
        </button>
        <button type="button" onClick={() => setOpenPanel(openPanel === "guests" ? null : "guests")} className={`px-4 py-2 border-r border-slate-200 transition ${openPanel === "guests" ? "bg-slate-100 shadow-inner" : "hover:bg-slate-50"}`}>
          {getGuestLabel()}
        </button>
        <div className="pl-3 pr-1 py-1">
          <button type="button" onClick={handleSearch} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0c1929] text-white hover:bg-[#152b47] transition">
            <Search className="h-4 w-4" />
          </button>
        </div>

        {mounted && openPanel === "dates" && (
          <div className="absolute right-0 top-[calc(100%+12px)] w-[min(100vw-32px,400px)] md:w-[850px] z-[9999] rounded-[32px] bg-white shadow-[0_8px_40px_rgba(12,25,41,0.12)] ring-1 ring-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <AvailabilityCalendar
              blockedDates={[]}
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInChange={setCheckIn}
              onCheckOutChange={(val) => {
                setCheckOut(val);
                if (val) setOpenPanel(null);
              }}
              minNights={0}
              showHeader={false}
            />
          </div>
        )}

        {mounted && openPanel === "guests" && (
          <div className="absolute right-0 top-[calc(100%+12px)] w-[400px] z-[9999] rounded-[32px] bg-white shadow-[0_8px_40px_rgba(12,25,41,0.12)] ring-1 ring-slate-200 p-8 animate-in fade-in zoom-in-95 duration-200">
            <GuestRow label="Adults" sublabel="Age 13+" value={adults} onDecrement={() => setAdults(Math.max(1, adults - 1))} onIncrement={() => setAdults(Math.min(16, adults + 1))} canDecrement={adults > 1} canIncrement={adults + childrenCount < 16} />
            <div className="w-full border-b border-slate-100 my-1"></div>
            <GuestRow label="Children" sublabel="Ages 2–12" value={childrenCount} onDecrement={() => setChildrenCount(Math.max(0, childrenCount - 1))} onIncrement={() => setChildrenCount(Math.min(16 - adults, childrenCount + 1))} canDecrement={childrenCount > 0} canIncrement={adults + childrenCount < 16} />
            <div className="w-full border-b border-slate-100 my-1"></div>
            <GuestRow label="Infants" sublabel="Under 2" value={infants} onDecrement={() => setInfants(Math.max(0, infants - 1))} onIncrement={() => setInfants(infants + 1)} canDecrement={infants > 0} canIncrement={true} />
            <div className="w-full border-b border-slate-100 my-1"></div>
            <GuestRow label="Pets" sublabel="Service animals aren't pets" value={pets} onDecrement={() => setPets(Math.max(0, pets - 1))} onIncrement={() => setPets(pets + 1)} canDecrement={pets > 0} canIncrement={true} />
            <div className="pt-2 mt-auto">
              <button type="button" onClick={(e) => { setOpenPanel(null); handleSearch(e); }} className="w-full rounded-[20px] bg-[#0c1929] py-4 text-base font-bold text-white shadow-lg shadow-[#0c1929]/20 transition hover:bg-[#152b47] active:scale-[0.98]">
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSearch} className="relative flex flex-1 flex-col gap-3 md:max-w-3xl md:flex-row md:items-center">
      <div className="relative flex-1 rounded-[24px] bg-slate-50 border border-slate-200 px-4 py-3 transition hover:bg-slate-100 hover:border-slate-300 focus-within:ring-2 focus-within:ring-[#0c1929] focus-within:bg-white">
        <button type="button" onClick={() => setOpenPanel(openPanel === "dates" ? null : "dates")} className="block w-full cursor-pointer text-left">
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0c1929]">
            <CalendarDays className="h-4 w-4" />
            Check-in / Check-out
          </span>
          <span className="mt-2 block text-sm font-medium text-[#0c1929]">{formatDateRangeField()}</span>
        </button>
      </div>

      <div className="relative rounded-[24px] bg-slate-50 border border-slate-200 px-4 py-3 transition hover:bg-slate-100 hover:border-slate-300 focus-within:ring-2 focus-within:ring-[#0c1929] focus-within:bg-white md:w-56">
        <button type="button" onClick={() => setOpenPanel(openPanel === "guests" ? null : "guests")} className="w-full cursor-pointer text-left">
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0c1929]">
            <Users className="h-4 w-4" />
            Guests
          </span>
          <span className="mt-2 block text-sm font-medium text-[#0c1929]">{getGuestLabel()}</span>
        </button>
      </div>

      <button type="submit" className="inline-flex h-[70px] w-[70px] cursor-pointer items-center justify-center rounded-full bg-[#0c1929] text-white transition hover:bg-[#152b47]" aria-label="Search">
        <Search className="h-5 w-5" />
      </button>

      {/* Discovery Default Mode Floating Popovers */}
      {mounted && openPanel === "dates" && (
        <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-[calc(100%+16px)] w-[min(100vw-32px,400px)] md:w-[850px] z-[9999] rounded-[32px] bg-white shadow-[0_8px_40px_rgba(12,25,41,0.12)] ring-1 ring-slate-200 animate-in fade-in zoom-in-95 duration-200">
          <AvailabilityCalendar
            blockedDates={[]}
            checkIn={checkIn}
            checkOut={checkOut}
            onCheckInChange={setCheckIn}
            onCheckOutChange={(val) => {
              setCheckOut(val);
              if (val) setOpenPanel(null);
            }}
            minNights={0}
            showHeader={false}
          />
        </div>
      )}

      {mounted && openPanel === "guests" && (
        <div className="absolute right-0 top-[calc(100%+16px)] w-[400px] z-[9999] rounded-[32px] bg-white shadow-[0_8px_40px_rgba(12,25,41,0.12)] ring-1 ring-slate-200 p-8 animate-in fade-in zoom-in-95 duration-200">
          <GuestRow label="Adults" sublabel="Age 13+" value={adults} onDecrement={() => setAdults(Math.max(1, adults - 1))} onIncrement={() => setAdults(Math.min(16, adults + 1))} canDecrement={adults > 1} canIncrement={adults + childrenCount < 16} />
          <div className="w-full border-b border-slate-100 my-1"></div>
          <GuestRow label="Children" sublabel="Ages 2–12" value={childrenCount} onDecrement={() => setChildrenCount(Math.max(0, childrenCount - 1))} onIncrement={() => setChildrenCount(Math.min(16 - adults, childrenCount + 1))} canDecrement={childrenCount > 0} canIncrement={adults + childrenCount < 16} />
          <div className="w-full border-b border-slate-100 my-1"></div>
          <GuestRow label="Infants" sublabel="Under 2" value={infants} onDecrement={() => setInfants(Math.max(0, infants - 1))} onIncrement={() => setInfants(infants + 1)} canDecrement={infants > 0} canIncrement={true} />
          <div className="w-full border-b border-slate-100 my-1"></div>
          <GuestRow label="Pets" sublabel="Service animals aren't pets" value={pets} onDecrement={() => setPets(Math.max(0, pets - 1))} onIncrement={() => setPets(pets + 1)} canDecrement={pets > 0} canIncrement={true} />
          <div className="pt-2 mt-auto">
            <button type="button" onClick={(e) => { setOpenPanel(null); handleSearch(e); }} className="w-full rounded-[20px] bg-[#0c1929] py-4 text-base font-bold text-white shadow-lg shadow-[#0c1929]/20 transition hover:bg-[#152b47] active:scale-[0.98]">
              Apply
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

function AccountButton() {
  const [session, setSession] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const guestToken = localStorage.getItem("guestToken");
    const adminToken = localStorage.getItem("adminToken");
    const token = guestToken || adminToken;
    if (!token) return;

    // Attempt to get a fresh name from the server (fixes stale "Guest" fallback)
    const tokenKey = guestToken ? "guestToken" : "adminToken";
    fetch((process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '') + "/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const p = data.profile || {};
        const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email || (guestToken ? "Guest" : "Admin");
        const storageKey = guestToken ? "guestName" : "adminName";
        localStorage.setItem(storageKey, name);
        setSession({ name, role: data.role });
      })
      .catch(() => {
        // Fallback to cached name
        if (guestToken) setSession({ name: localStorage.getItem("guestName") || "Guest", role: "GUEST" });
        else setSession({ name: localStorage.getItem("adminName") || "Admin", role: "ADMIN" });
      });

    function handleOutside(e) {
      if (!menuRef.current?.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("guestToken");
    localStorage.removeItem("guestName");
    localStorage.removeItem("guestEmail");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    document.cookie = "guestToken=; path=/; max-age=0";
    document.cookie = "adminToken=; path=/; max-age=0";
    setSession(null);
    setIsOpen(false);
    window.location.href = "/";
  };

  if (!session) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0c1929] transition hover:border-slate-300 hover:shadow-sm"
      >
        <UserCircle2 className="h-4 w-4 text-[#0c1929]" />
        Sign In / Sign Up
      </Link>
    );
  }

  const initials = session.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const firstName = session.name.split(" ")[0];

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(c => !c)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-4 py-1 text-sm font-semibold text-[#0c1929] transition hover:border-slate-300 hover:shadow-sm"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0c1929] text-xs font-bold text-white">
          {initials}
        </span>
        {firstName}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-52 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgba(12,25,41,0.12)] animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-[#0c1929] truncate">{session.name}</p>
            <p className="text-xs text-[#0c1929] mt-0.5">{session.role === "GUEST" ? "Guest" : "Admin"}</p>
          </div>
          <div className="p-1.5">
            <Link
              href={session.role === "GUEST" ? "/trips" : "/admin"}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[#0c1929] transition hover:bg-slate-50 hover:text-[#0c1929]"
            >
              <UserCircle2 className="h-4 w-4 text-[#0c1929]" />
              {session.role === "GUEST" ? "My Trips" : "Dashboard"}
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const booking = normalizeBooking(searchParams);
  const router = useRouter();
  const [tripsDetail, setTripsDetail] = useState(false);
  const [reserveInfo, setReserveInfo] = useState(null);

  useEffect(() => {
    const handler = (e) => setTripsDetail(e.detail?.isDetail || false);
    window.addEventListener('trips-detail-state', handler);
    return () => window.removeEventListener('trips-detail-state', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => setReserveInfo(e.detail);
    window.addEventListener('reserve-btn-visibility', handler);
    return () => {
      window.removeEventListener('reserve-btn-visibility', handler);
      setReserveInfo(null);
    };
  }, [pathname]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const isDiscovery = pathname === "/" || pathname === "/search";
  const isListing = pathname?.startsWith("/listing/");
  const showStickyReserve = isListing && reserveInfo && !reserveInfo.visible;

  if (!isDiscovery) {
    const isTrips = pathname?.startsWith("/trips");
    const isCheckout = pathname?.startsWith("/checkout");

    // Context-aware back navigation
    let backLabel, backAction;
    if (isTrips && tripsDetail) {
      backLabel = "Back to trips";
      backAction = () => window.dispatchEvent(new CustomEvent('nav-back-trips'));
    } else if (isCheckout) {
      backLabel = "Back to listing";
      backAction = null; // uses Link
    } else {
      backLabel = "Back to search";
      backAction = null; // uses Link
    }
    const listingId = searchParams.get('listing');
    let backHref = `/?${new URLSearchParams(buildBookingQuery(booking)).toString()}`;
    if (isCheckout) {
      backHref = listingId ? `/listing/${listingId}?${new URLSearchParams(buildBookingQuery(booking)).toString()}` : "/";
    }

    function handleStickyReserve() {
      if (!reserveInfo) return;
      if (reserveInfo.hasBooking) {
        const params = new URLSearchParams({
          listing: reserveInfo.listingId,
          checkIn: reserveInfo.checkIn,
          checkOut: reserveInfo.checkOut,
          guests: String(reserveInfo.guests),
        });
        if (reserveInfo.nonRefundable) params.append("nonRefundable", "true");
        router.push(`/checkout?${params.toString()}`);
      }
    }

    return (
      <nav className={`sticky top-0 z-50 w-full ${isListing ? 'hidden lg:block' : ''}`}>
        <div className="flex w-full items-center justify-between bg-white/80 backdrop-blur-xl shadow-sm border-b border-white/60 px-6 py-4 md:px-10">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center">
              <img src="/suites-logo.png" alt="HomEV" className="h-8 w-auto object-contain mix-blend-multiply opacity-80" />
            </Link>
            
            <div className="hidden sm:block h-5 w-px bg-slate-200" />

            {(isTrips && !tripsDetail) ? (
              <Link href="/" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#0c1929] transition">
                <ChevronLeft className="h-4 w-4" />
                Back to search
              </Link>
            ) : backAction ? (
              <button onClick={backAction} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#0c1929] transition">
                <ChevronLeft className="h-4 w-4" />
                {backLabel}
              </button>
            ) : (
              <Link href={backHref} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#0c1929] transition">
                <ChevronLeft className="h-4 w-4" />
                {backLabel}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {showStickyReserve && (
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-300 mr-2">
                {reserveInfo.hasBooking && (
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-[15px] font-semibold text-[#0c1929]">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(reserveInfo.total)} total
                    </span>
                    <span className="text-xs text-[#0c1929]">
                      {reserveInfo.nights} night{reserveInfo.nights !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                <button
                  onClick={handleStickyReserve}
                  disabled={!reserveInfo.hasBooking}
                  className="rounded-full bg-gradient-to-r from-[#0c1929] to-[#152b47] px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(12,25,41,0.2)] transition hover:from-[#152b47] hover:to-[#0c1929] active:scale-[0.97] disabled:opacity-50"
                >
                  {reserveInfo.hasBooking ? "Reserve" : "Check availability"}
                </button>
              </div>
            )}
            
            <div className="hidden md:block mr-1">
              <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-[#0c1929] transition hover:border-slate-300 hover:shadow-sm">
                Contact Us
              </Link>
            </div>
            
            <AccountButton />
          </div>
        </div>
      </nav>
    );
  }

  // Discovery page: hero layout has its own nav in the left panel
  return null;
}
