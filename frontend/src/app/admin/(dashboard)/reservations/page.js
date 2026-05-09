"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FilePlus2, MoreHorizontal, X, User, Calendar, CreditCard, Home, ArrowRight, ExternalLink, AlertTriangle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const today = () => new Date().toISOString().split('T')[0];
const uplistingUrl = (id) => `https://app.uplisting.io/calendar/bookings/${id}/details?from=${today()}`;

export default function ReservationsModule() {
  const router = useRouter();
  const [list, setList] = useState([]);
  const [lastCount, setLastCount] = useState(0);
  const [uplistingActionUrl, setUplistingActionUrl] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  // Map of uplistingBookingId -> { active: bool, loading: bool }
  const [uplistingStatus, setUplistingStatus] = useState({});

  async function loadReservations() {
    try {
      const res = await fetch(`${API}/guests/reservations/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const mapped = data.data.map(r => {
          const g = r.guest || {};
          const p = r.property || {};
          const nights = Math.round((new Date(r.endDate) - new Date(r.startDate)) / 86400000);
          const total = r.totalPrice != null
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD' }).format(r.totalPrice)
            : `$${(nights * (p.pricePerNight || 200)).toFixed(2)}`;
          const now = new Date();
          const start = new Date(r.startDate);
          const end = new Date(r.endDate);
          let status = 'Upcoming';
          if (r.status === 'CANCELLED') status = 'Cancelled';
          else if (end < now) status = 'Completed';
          else if (start <= now && end >= now) status = 'Checked In';
          return {
            id: r.id,
            uplistingBookingId: r.uplistingBookingId || null,
            guestId: g.id,
            guest: `${g.firstName || ''} ${g.lastName || ''}`.trim() || 'Guest',
            property: p.title || r.propertyId || 'Unknown',
            dates: `${new Date(r.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(r.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
            nights, total, status,
            details: {
              adults: r.adults || r.numGuests || 1, children: 0,
              channel: 'Direct',
              bookedOn: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '',
              email: g.email || '', phone: g.phone || '',
              notes: '', hostFee: '$0', cleaningFee: '$0'
            }
          };
        });
        if (lastCount > 0 && mapped.length > lastCount) setSelectedReservation(mapped[0]);
        setLastCount(mapped.length);
        setList(mapped);
      }
    } catch (e) { console.error(e); }
  }

  // Fetch live Uplisting status for a booking ID (called lazily per cancelled card)
  const checkUplistingStatus = useCallback(async (uplistingBookingId) => {
    if (!uplistingBookingId || uplistingStatus[uplistingBookingId] !== undefined) return;
    setUplistingStatus(prev => ({ ...prev, [uplistingBookingId]: { active: false, loading: true } }));
    try {
      const res = await fetch(`${API}/admin/uplisting/bookings/${uplistingBookingId}/status`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      setUplistingStatus(prev => ({ ...prev, [uplistingBookingId]: { active: data.active ?? true, loading: false } }));
    } catch {
      setUplistingStatus(prev => ({ ...prev, [uplistingBookingId]: { active: true, loading: false } }));
    }
  }, [uplistingStatus]);

  const handleDeleteReservation = async (id, guestName) => {
    if (!confirm(`Cancel the reservation for ${guestName}?`)) return;
    try {
      const res = await fetch(`${API}/reservations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const cancelled = list.find(b => b.id === id);
        setList(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b));
        setSelectedReservation(null);
        if (cancelled?.uplistingBookingId) {
          setUplistingActionUrl(uplistingUrl(cancelled.uplistingBookingId));
          // Immediately trigger status check for the newly cancelled card
          setUplistingStatus(prev => ({ ...prev, [cancelled.uplistingBookingId]: { active: true, loading: false } }));
        }
      } else {
        const data = await res.json();
        alert(`Failed to cancel: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('Network error while trying to communicate with server');
    }
  };

  useEffect(() => {
    loadReservations();
    const interval = setInterval(loadReservations, 30000);
    return () => clearInterval(interval);
  }, []);

  const cancelled = list.filter(r => r.status === 'Cancelled');
  const upcoming = list.filter(r => r.status === 'Upcoming');
  const checkedIn = list.filter(r => r.status === 'Checked In');
  const completed = list.filter(r => r.status === 'Completed');

  const ReservationCard = ({ res, statusColor }) => (
    <div onClick={() => setSelectedReservation(res)} className="group bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200 cursor-pointer flex flex-col gap-4 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${statusColor} rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#0c1929] flex items-center justify-center text-white font-black text-sm shadow-md ring-2 ring-white shrink-0">
          {res.guest.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-[#0c1929] truncate leading-tight mb-0.5">{res.guest}</p>
          <p className="text-[10px] text-[#0c1929]/50 font-black uppercase tracking-widest">{res.id.split('-')[0]}</p>
        </div>
        <button className="text-slate-400 hover:text-[#0c1929] transition p-1.5 hover:bg-slate-100 rounded-full shrink-0">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      <div className="bg-slate-50/80 rounded-[14px] p-3 border border-slate-100">
        <div className="flex items-start gap-2 mb-2.5">
          <Home className="w-3.5 h-3.5 text-[#0c1929]/70 mt-0.5 shrink-0" />
          <p className="text-[12px] font-bold text-[#0c1929] leading-snug">{res.property}</p>
        </div>
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 bg-white px-2 py-1.5 rounded-lg border border-slate-100">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-[#0c1929]/40" /> {res.dates.split(' – ')[0] || res.dates.split(' - ')[0]}
          </div>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <div className="flex items-center gap-1.5">{res.dates.split(' – ')[1] || res.dates.split(' - ')[1]}</div>
        </div>
      </div>
      <div className="flex items-end justify-between mt-0.5">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#0c1929]/40 mb-1">Total</p>
          <p className="text-[16px] font-black text-[#0c1929] tracking-tight">{res.total}</p>
        </div>
        <div className="text-[10px] font-black uppercase tracking-wider text-[#0c1929] bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          {res.nights} Night{res.nights !== 1 && 's'}
        </div>
      </div>
    </div>
  );

  // Cancelled card wrapper — checks live Uplisting status on mount
  const CancelledCardWrapper = ({ res }) => {
    useEffect(() => { checkUplistingStatus(res.uplistingBookingId); }, [res.uplistingBookingId]);
    const statusInfo = res.uplistingBookingId ? uplistingStatus[res.uplistingBookingId] : null;
    const showCancelBtn = statusInfo && !statusInfo.loading && statusInfo.active;
    return (
      <div>
        <ReservationCard res={res} statusColor="from-red-400" />
        {res.uplistingBookingId && (
          showCancelBtn ? (
            <a href={uplistingUrl(res.uplistingBookingId)} target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="mt-1.5 flex items-center gap-1.5 justify-center w-full rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 py-2 text-[11px] font-bold text-amber-700 transition-colors">
              <ExternalLink className="w-3 h-3" /> Cancel in Uplisting dashboard
            </a>
          ) : statusInfo && !statusInfo.loading && !statusInfo.active ? (
            <div className="mt-1.5 flex items-center gap-1.5 justify-center w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-[11px] font-bold text-emerald-600">
              ✓ Already cancelled in Uplisting
            </div>
          ) : (
            <div className="mt-1.5 flex items-center justify-center w-full py-2 text-[11px] text-slate-400">Checking Uplisting…</div>
          )
        )}
      </div>
    );
  };

  // Column component
  const Column = ({ title, dot, bg, border, count, countStyle, children, empty }) => (
    <div className={`w-[360px] flex flex-col gap-4 ${bg} rounded-[24px] p-4 ${border} shadow-inner h-full overflow-y-auto hide-scrollbar`}>
      <div className="flex items-center justify-between mb-1 px-1">
        <h2 className="text-[11px] font-black text-[#0c1929] uppercase tracking-[0.15em] flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot}`}></span>{title}
        </h2>
        <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${countStyle}`}>{count}</span>
      </div>
      <div className="flex flex-col gap-3">{children}{count === 0 && <p className="text-sm font-medium text-slate-400 text-center py-8">{empty}</p>}</div>
    </div>
  );

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Uplisting Manual Action Banner */}
      {uplistingActionUrl && (
        <div className="mb-6 flex items-start gap-4 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 shadow-sm shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900">Manual action required in Uplisting</p>
            <p className="text-xs font-semibold text-amber-700 mt-0.5 leading-relaxed">
              The website reservation has been cancelled and the calendar unblocked. You must also manually cancel this booking in the Uplisting dashboard.
            </p>
            <a href={uplistingActionUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Open booking in Uplisting →
            </a>
          </div>
          <button onClick={() => setUplistingActionUrl(null)} className="text-amber-400 hover:text-amber-600 transition shrink-0 p-1 rounded-lg hover:bg-amber-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-8 shrink-0">
        <h1 className="text-3xl font-bold text-[#0c1929] tracking-tight">Booking Pipeline</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#0c1929]" />
            <input type="text" placeholder="Search reservations..." className="glass-input pl-9 pr-4 py-2 rounded-xl text-sm outline-none font-medium text-[#0c1929]" />
          </div>
          <button className="glass-button rounded-xl px-5 py-2.5 text-sm font-bold transition-all flex items-center gap-2 hover:bg-white/80 hover:shadow-lg active:bg-white/40 border border-white/60 shadow-md">
            <FilePlus2 className="w-4 h-4" /> Manual Booking
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 hide-scrollbar">
        <div className="flex gap-6 h-full min-w-max items-start">

          {/* CANCELLED — first column */}
          <Column title="Cancelled" dot="bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]"
            bg="bg-red-50/60" border="border border-red-100/80"
            count={cancelled.length} countStyle="text-red-400/70 bg-red-100"
            empty="No cancellations">
            {cancelled.map(res => <CancelledCardWrapper key={res.id} res={res} />)}
          </Column>

          {/* UPCOMING */}
          <Column title="Upcoming" dot="bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
            bg="bg-[#f3f5f8]" border="border border-slate-200/60"
            count={upcoming.length} countStyle="text-[#0c1929]/50 bg-slate-200"
            empty="No upcoming bookings">
            {upcoming.map(res => (
              <div key={res.id}>
                <ReservationCard res={res} statusColor="from-blue-500" />
                {res.uplistingBookingId && (
                  <a href={uplistingUrl(res.uplistingBookingId)} target="_blank" rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="mt-1.5 flex items-center gap-1.5 justify-center w-full rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 py-2 text-[11px] font-bold text-blue-700 transition-colors">
                    <ExternalLink className="w-3 h-3" /> Visit booking in Uplisting dashboard
                  </a>
                )}
              </div>
            ))}
          </Column>

          {/* CHECKED IN */}
          <Column title="Checked In" dot="bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"
            bg="bg-[#f3f5f8]" border="border border-slate-200/60"
            count={checkedIn.length} countStyle="text-[#0c1929]/50 bg-slate-200"
            empty="No active stays">
            {checkedIn.map(res => <ReservationCard key={res.id} res={res} statusColor="from-emerald-500" />)}
          </Column>

          {/* COMPLETED */}
          <Column title="Completed" dot="bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.6)]"
            bg="bg-[#f3f5f8]" border="border border-slate-200/60"
            count={completed.length} countStyle="text-[#0c1929]/50 bg-slate-200"
            empty="No completed stays">
            {completed.map(res => <ReservationCard key={res.id} res={res} statusColor="from-slate-500" />)}
          </Column>

        </div>
      </div>

      {/* Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-[#0c1929]/60 backdrop-blur-md" onClick={() => setSelectedReservation(null)}></div>
          <div className="glass-panel-strong w-full h-full max-w-[1600px] bg-white/95 relative z-10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/20 bg-white/20 flex justify-between items-center backdrop-blur-md">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-[#0c1929]">{selectedReservation.guest}</h2>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                    selectedReservation.status === 'Checked In' ? 'bg-emerald-500 text-white border-emerald-600' :
                    selectedReservation.status === 'Upcoming' ? 'bg-blue-500 text-white border-blue-600' :
                    selectedReservation.status === 'Cancelled' ? 'bg-red-500 text-white border-red-600' :
                    'bg-amber-500 text-white border-amber-600'}`}>
                    {selectedReservation.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#0c1929] flex items-center gap-2">
                  {selectedReservation.id} <span className="opacity-50">•</span> Booked via {selectedReservation.details.channel} on {selectedReservation.details.bookedOn}
                </p>
              </div>
              <button onClick={() => setSelectedReservation(null)} className="text-[#0c1929] transition bg-white/40 hover:bg-white rounded-full p-2 shadow-sm border border-transparent hover:border-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-2 gap-8 bg-slate-50/20">
              <div className="space-y-6">
                <div>
                  <h3 className="text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> Trip Details</h3>
                  <div className="glass-panel p-4 space-y-4 bg-white/50 border-white/60">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#0c1929]">Property Assignment</p>
                      <p className="text-sm font-bold text-[#0c1929]">{selectedReservation.property}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-[#0c1929]">Stay Dates</p>
                        <p className="text-sm font-bold text-[#0c1929]">{selectedReservation.dates}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-[#0c1929]">Occupants</p>
                        <p className="text-sm font-bold text-[#0c1929]">{selectedReservation.details.adults} Adults, {selectedReservation.details.children} Kids</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Guest Identity</h3>
                  <div className="glass-panel p-4 space-y-4 bg-white/50 border-white/60">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#0c1929]">Email Address</p>
                      <p className="text-sm font-bold text-blue-600 underline cursor-pointer">{selectedReservation.details.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#0c1929]">Phone</p>
                      <p className="text-sm font-bold text-[#0c1929]">{selectedReservation.details.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-[11px] font-bold text-[#0c1929] uppercase tracking-widest mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Accounting Breakdown</h3>
                  <div className="glass-panel p-5 bg-white/50 border-white/60 flex flex-col h-full shadow-sm">
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-2">
                        <span className="font-semibold text-[#0c1929]">Base Accommodation</span>
                        <span className="font-bold text-[#0c1929]">{selectedReservation.total}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-2">
                        <span className="font-semibold text-[#0c1929]">Cleaning Fee</span>
                        <span className="font-bold text-[#0c1929]">{selectedReservation.details.cleaningFee}</span>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-slate-300/40 flex justify-between items-center bg-emerald-50/20 p-2 rounded-xl">
                      <span className="font-bold text-[#0c1929] ml-2">Net Earned Payout</span>
                      <span className="text-2xl font-black text-emerald-600 mr-2">{selectedReservation.total}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  {/* Visit in Uplisting button (always visible if has uplistingBookingId) */}
                  {selectedReservation.uplistingBookingId && (
                    <a href={uplistingUrl(selectedReservation.uplistingBookingId)} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl text-sm font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
                      <ExternalLink className="w-4 h-4" />
                      {selectedReservation.status === 'Cancelled' ? 'Open in Uplisting dashboard' : 'Visit booking in Uplisting dashboard'}
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleDeleteReservation(selectedReservation.id, selectedReservation.guest)}
                      className="bg-red-50 text-red-600 w-full px-4 py-3.5 rounded-xl text-sm font-bold shadow-md hover:bg-red-100 transition border border-red-200 hover:shadow-lg">
                      Cancel
                    </button>
                    <button onClick={() => router.push('/admin/inbox')}
                      className="bg-[#0c1929] text-white w-full px-4 py-3.5 rounded-xl text-sm font-bold shadow-md hover:bg-[#152b47] transition border border-[#0c1929] hover:shadow-lg">
                      Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
