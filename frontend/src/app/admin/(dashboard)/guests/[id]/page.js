"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Mail, Phone, Calendar, LoaderCircle, 
  MapPin, CheckCircle, Clock, CreditCard, DollarSign, Key, Shield
} from "lucide-react";

export default function GuestDetailView() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGuestData = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + ''}/guests/${id}`, {
          headers: {
            "x-auth-token": token,
            "Authorization": `Bearer ${token}` 
          }
        });
        const data = await res.json();
        
        if (!res.ok) {
           throw new Error(data.msg || data.error || "Failed to load guest data");
        }
        
        if (data.success && data.data) {
           setGuest(data.data);
        } else {
           throw new Error("Guest payload invalid");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
       fetchGuestData();
    }
  }, [id]);

  const formatPhone = (phoneStr) => {
     if (!phoneStr) return phoneStr;
     const digits = phoneStr.replace(/\D/g, '');
     if (digits.length === 10) return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
     if (digits.length === 11 && digits.startsWith('1')) return `+1 ${digits.slice(1,4)}-${digits.slice(4,7)}-${digits.slice(7)}`;
     return phoneStr;
  };

  const formatDate = (dateString, full = false) => {
    if (!dateString) return "N/A";
    const opts = full ? { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { month: 'short', day: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, opts);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white/40 rounded-3xl border border-white/60">
        <LoaderCircle className="w-8 h-8 text-slate-300 animate-spin" />
        <p className="mt-4 text-sm text-[#0c1929] font-medium tracking-wide">Compiling intelligence file...</p>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="p-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[#0c1929] hover:text-[#0c1929] transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </button>
        <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-4 text-sm font-medium shadow-sm">
          Error: {error || "Guest not found"}
        </div>
      </div>
    );
  }

  const allTransactions = guest.reservations?.flatMap(r => 
    (r.transactions || []).map(t => ({ ...t, resStartDate: r.startDate, propTitle: r.property?.title }))
  ) || [];

  return (
    <div className="h-full flex flex-col overflow-y-auto pb-12 pr-2">
      {/* Header and Back navigation */}
      <div className="mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[#0c1929] hover:text-[#0c1929] transition mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </button>
        <div className="flex items-end justify-between">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-700 font-bold text-3xl border-2 border-white shadow-md">
                   {guest.firstName ? guest.firstName.charAt(0).toUpperCase() : 'G'}
                </div>
                <div>
                <h1 className="text-3xl font-bold text-[#0c1929] tracking-tight flex items-center gap-3">
                    {guest.firstName} {guest.lastName}
                    <span className="text-[10px] uppercase tracking-widest bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold">Verified</span>
                </h1>
                <p className="mt-2 text-sm font-mono text-[#0c1929]">ID: {guest.id}</p>
                </div>
            </div>
            <button onClick={() => router.push('/admin/inbox')} className="px-5 py-2.5 bg-[#0c1929] text-white rounded-xl text-sm font-semibold shadow-md hover:bg-[#0c1929] transition flex items-center gap-2">
                <Mail className="w-4 h-4" /> Send Secure Message
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Contact Intelligence */}
        <div className="glass-panel p-6 border border-white/60 shadow-sm flex flex-col justify-center">
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#0c1929] mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#0c1929]" /> Contact Intel
            </h3>
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[#0c1929] border border-slate-100"><Mail className="w-4 h-4" /></div>
                  <div>
                      <p className="text-[10px] uppercase font-bold text-[#0c1929] tracking-widest">Email Address</p>
                      <p className="text-sm font-medium text-[#0c1929]">
                         {guest.email && !guest.email.includes('@placeholder.com') ? guest.email : <span className="text-[#0c1929] italic">Not available</span>}
                      </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[#0c1929] border border-slate-100"><Phone className="w-4 h-4" /></div>
                  <div>
                      <p className="text-[10px] uppercase font-bold text-[#0c1929] tracking-widest">Phone Number</p>
                      <p className="text-sm font-medium text-[#0c1929]">
                         {guest.phone ? formatPhone(guest.phone) : <span className="text-[#0c1929] italic">Not available</span>}
                      </p>
                  </div>
                </div>
            </div>
        </div>

        {/* Login & Auth Logs */}
        <div className="glass-panel p-6 border border-white/60 shadow-sm flex flex-col justify-center">
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#0c1929] mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0c1929]" /> Security & Access Logs
            </h3>
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[#0c1929] border border-slate-100"><Key className="w-4 h-4" /></div>
                  <div>
                      <p className="text-[10px] uppercase font-bold text-[#0c1929] tracking-widest">Account Created / Initial Auth</p>
                      <p className="text-sm font-medium text-[#0c1929]">{formatDate(guest.createdAt, true)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[#0c1929] border border-slate-100"><Clock className="w-4 h-4" /></div>
                  <div>
                      <p className="text-[10px] uppercase font-bold text-[#0c1929] tracking-widest">Last OTP Requested (Latest Login)</p>
                      <p className="text-sm font-medium text-[#0c1929]">
                          {guest.otpExpiresAt ? formatDate(guest.otpExpiresAt, true) : <span className="text-[#0c1929] italic">No recent OTP logs</span>}
                      </p>
                  </div>
                </div>
            </div>
        </div>
        
        {/* Status */}
        <div className="glass-panel p-6 border border-white/60 shadow-sm flex flex-col justify-center bg-[#0c1929] text-white relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#0c1929] mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Overall Standing
            </h3>
            <div className="flex items-end gap-3 mb-2">
                <span className="text-4xl font-bold">{guest.reservations?.length || 0}</span>
                <span className="text-sm text-[#0c1929] pb-1">Total Bookings</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-2"><div className="bg-blue-500 h-1.5 rounded-full" style={{width: guest.reservations?.length ? '100%' : '5%'}}></div></div>
            <p className="text-xs text-[#0c1929] mt-2 leading-relaxed">
              Account is in good standing. Clean security record.
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Reservation Log */}
          <div>
             <h3 className="text-lg font-bold text-[#0c1929] mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-500" /> Bookings Ledger</h3>
             <div className="glass-panel overflow-hidden border border-white/60 shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50/90 text-[10px] uppercase tracking-widest text-[#0c1929] border-b border-slate-200">
                        <tr>
                            <th className="px-5 py-3 font-bold">Property & Dates</th>
                            <th className="px-5 py-3 font-bold text-center">Status</th>
                            <th className="px-5 py-3 font-bold text-right">Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white/80">
                        {guest.reservations?.length > 0 ? guest.reservations.map(res => (
                            <tr key={res.id} className="hover:bg-slate-50/50 transition">
                                <td className="px-5 py-4">
                                    <p className="font-bold text-[#0c1929] mb-0.5">{res.property?.title || 'Unknown Property'}</p>
                                    <p className="text-xs text-[#0c1929]">
                                        {formatDate(res.startDate)} <span className="mx-1 text-slate-300">→</span> {formatDate(res.endDate)}
                                    </p>
                                </td>
                                <td className="px-5 py-4 text-center">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                                        res.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        res.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        'bg-slate-50 text-[#0c1929] border-slate-200'
                                    }`}>
                                        {res.status}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-right font-bold text-[#0c1929]">
                                    ${res.totalPrice?.toFixed(2)}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="3" className="px-5 py-8 text-center text-[#0c1929] italic">No bookings on record.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
          </div>

          {/* Transactions Log */}
          <div>
             <h3 className="text-lg font-bold text-[#0c1929] mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-500" /> Payments Ledger</h3>
             <div className="glass-panel overflow-hidden border border-white/60 shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50/90 text-[10px] uppercase tracking-widest text-[#0c1929] border-b border-slate-200">
                        <tr>
                            <th className="px-5 py-3 font-bold">Transaction Time</th>
                            <th className="px-5 py-3 font-bold">Reference</th>
                            <th className="px-5 py-3 font-bold text-center">Status</th>
                            <th className="px-5 py-3 font-bold text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white/80">
                        {allTransactions.length > 0 ? allTransactions.map(tx => (
                            <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                                <td className="px-5 py-4">
                                    <p className="font-bold text-[#0c1929] mb-0.5">{formatDate(tx.createdAt, true)}</p>
                                    <p className="text-[10px] text-[#0c1929] font-mono uppercase tracking-wider">{tx.id.split('-')[0]}</p>
                                </td>
                                <td className="px-5 py-4 text-xs font-medium text-[#0c1929]">
                                    <p className="text-[#0c1929]">{tx.propTitle}</p>
                                    <p className="text-[10px] uppercase opacity-70 mt-0.5 whitespace-nowrap">Res: {formatDate(tx.resStartDate)}</p>
                                </td>
                                <td className="px-5 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                        {tx.status === 'COMPLETED' ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> :
                                         tx.status === 'PENDING' ? <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> :
                                         <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#0c1929]">{tx.status}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-right font-bold text-[#0c1929] flex flex-col items-end">
                                    <span className="flex items-center"><DollarSign className="w-3.5 h-3.5 text-[#0c1929]" />{tx.amount?.toFixed(2)}</span>
                                    <span className="text-[9px] uppercase tracking-widest font-bold text-[#0c1929] mt-0.5">{tx.currency || 'USD'}</span>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="px-5 py-8 text-center text-[#0c1929] italic">No payments on record.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
          </div>
      </div>
    </div>
  );
}
