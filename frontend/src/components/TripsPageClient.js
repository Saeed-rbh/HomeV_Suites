"use client";

import { useState, useEffect } from "react";
import UnifiedAuthForm from "./UnifiedAuthForm";
import TripDashboardUI from "./TripDashboardUI";
import { LoaderCircle, MapPin, Calendar, ChevronRight, LogOut } from "lucide-react";

function BookingCard({ reservation, onClick }) {
  const now = new Date();
  const start = new Date(reservation.startDate);
  const end = new Date(reservation.endDate);
  const isPast = end < now;
  const isCurrent = start <= now && end >= now;

  const property = reservation.property || {};
  const images = (() => {
    try { return property.images ? JSON.parse(property.images) : []; } catch { return []; }
  })();
  const image = images[0] || property.thumbnailUrl || "https://images.unsplash.com/photo-1502672260266-1c15874f26db?w=800&q=80";

  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));

  const statusLabel = isCurrent ? "Currently staying" : isPast ? "Completed" : "Upcoming";
  const statusColor = isCurrent
    ? "bg-emerald-100 text-emerald-700"
    : isPast
      ? "bg-slate-100 text-[#0c1929]"
      : "bg-blue-50 text-blue-600";

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-5 rounded-[28px] bg-white border border-slate-100 shadow-[0_2px_16px_rgba(12,25,41,0.04)] p-4 text-left transition hover:shadow-[0_4px_24px_rgba(12,25,41,0.08)] hover:border-slate-200"
    >
      {/* Thumbnail */}
      <div className="w-32 self-stretch shrink-0 overflow-hidden rounded-[18px] bg-slate-100">
        <img src={image} alt={property.title} className="h-full w-full object-cover transition group-hover:scale-105" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${statusColor} mb-2`}>
          {statusLabel}
        </span>
        <h3 className="text-base font-medium text-[#0c1929] truncate">{property.title || "Your booking"}</h3>
        <div className="mt-1 flex items-center gap-1 text-sm text-[#0c1929]">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{property.address || property.location || "Location on file"}</span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-sm text-[#0c1929]">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>
            {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
            {end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {" · "}{nights} night{nights !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 self-center text-slate-300 group-hover:text-[#0c1929] transition" />
    </button>
  );
}

function PastTripCard({ reservation, onClick }) {
  const property = reservation.property || {};
  const images = (() => {
    try { return property.images ? JSON.parse(property.images) : []; } catch { return []; }
  })();
  const image = images[0] || property.thumbnailUrl || "https://images.unsplash.com/photo-1502672260266-1c15874f26db?w=800&q=80";

  return (
    <button
      onClick={onClick}
      className="group flex flex-col w-full overflow-hidden rounded-[24px] bg-white border border-slate-100 shadow-sm transition hover:shadow-md hover:border-slate-200"
    >
      <div className="aspect-square w-full overflow-hidden bg-slate-100">
        <img src={image} alt={property.title} className="h-full w-full object-cover transition group-hover:scale-105" />
      </div>
      <div className="p-3 text-left">
        <h4 className="text-sm font-semibold text-[#0c1929] truncate">{property.title || "Trip"}</h4>
        <p className="text-[11px] text-[#0c1929] mt-0.5">
          {new Date(reservation.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </p>
      </div>
    </button>
  );
}

export default function TripsPageClient() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("guestToken");
    if (storedToken) {
      setToken(storedToken);
      fetchReservations(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Listen for NavBar back button on /trips
  useEffect(() => {
    const handler = () => setSelected(null);
    window.addEventListener('nav-back-trips', handler);
    return () => window.removeEventListener('nav-back-trips', handler);
  }, []);

  // Notify NavBar whether a booking detail is open
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('trips-detail-state', { detail: { isDetail: !!selected } }));
  }, [selected]);

  async function fetchReservations(activeToken) {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '') + "/guests/me/reservations", {
        headers: { "Authorization": `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReservations(data.data || []);
      } else {
        localStorage.removeItem("guestToken");
        setToken(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center bg-[#f3f5f8]">
        <LoaderCircle className="w-8 h-8 animate-spin text-[#0c1929]" />
      </div>
    );
  }

  if (!token) {
    return (
      <UnifiedAuthForm
        title="Guest Access"
        subtitle="Sign in to your trips"
        onLoginSuccess={() => {
          const newToken = localStorage.getItem("guestToken");
          setToken(newToken);
          fetchReservations(newToken);
        }}
      />
    );
  }

  // If user clicked into a specific booking → show full detail view
  if (selected) {
    return (
      <TripDashboardUI
        listing={selected.property}
        reservation={selected}
        allReservations={reservations}
      />
    );
  }

  const now = new Date();
  const activeReservations = reservations.filter(r => r.status !== 'CANCELLED');
  const upcoming = activeReservations.filter(r => new Date(r.endDate) >= now).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const past = activeReservations.filter(r => new Date(r.endDate) < now).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  return (
    <div className="min-h-screen px-4 pb-20 pt-10 md:px-8" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0c1929] mb-1.5">My Account</p>
          <h1 className="text-4xl font-black tracking-tight text-[#0c1929]">Your trips</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Upcoming Bookings - Left 60% */}
          <div className="lg:w-[60%]">
            <h2 className="text-xl font-bold text-[#0c1929] mb-6 flex items-center gap-2.5">
              Upcoming Bookings
              <span className="inline-flex h-6 min-w-[32px] items-center justify-center rounded-lg bg-emerald-100 px-2 text-[12px] font-bold text-emerald-700 border border-emerald-200 shadow-sm">
                {upcoming.length}
              </span>
            </h2>

            {upcoming.length === 0 ? (
              <div className="rounded-[28px] bg-white border border-slate-100 shadow-sm p-12 text-center">
                <p className="text-[#0c1929] text-sm">
                  You have no upcoming trips. Book a stay to get started!
                </p>
                <a
                  href="/"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-[24px] bg-[#0c1929] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#152b47]"
                >
                  Explore stays →
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {upcoming.map(r => (
                  <BookingCard key={r.id} reservation={r} onClick={() => setSelected(r)} />
                ))}
              </div>
            )}
          </div>

          {/* Past Reservations - Right 40% */}
          <div className="lg:w-[40%]">
            <h2 className="text-xl font-bold text-[#0c1929] mb-6 flex items-center gap-2.5">
              Past Reservations
              <span className="inline-flex h-6 min-w-[32px] items-center justify-center rounded-lg bg-slate-100 px-2 text-[12px] font-bold text-[#0c1929] border border-slate-200">
                {past.length}
              </span>
            </h2>
            
            {past.length === 0 ? (
              <div className="rounded-[28px] bg-white/50 border border-dashed border-slate-200 p-8 text-center">
                <p className="text-[#0c1929] text-sm italic">No past trips yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-4">
                {past.map(r => (
                  <PastTripCard key={r.id} reservation={r} onClick={() => setSelected(r)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
