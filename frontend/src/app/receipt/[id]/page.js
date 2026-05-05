"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoaderCircle, Printer, ArrowLeft, Home, MapPin, Calendar, CreditCard, Download } from "lucide-react";
import Link from "next/link";

export default function ReceiptPage() {
  const { id } = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("guestToken");
    if (!token) {
      setError("Please log in to view this receipt.");
      setLoading(false);
      return;
    }

    fetch((process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '') + "/guests/me/reservations", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
           const resv = data.data.find(r => r.id === id);
           if (resv) {
               setReservation(resv);
           } else {
               setError("Receipt not found for this reservation.");
           }
        } else {
           setError("Failed to load reservation details.");
        }
      })
      .catch(err => setError("Network error while fetching receipt."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f5f8]">
        <LoaderCircle className="h-8 w-8 animate-spin text-[#0c1929]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f3f5f8] px-4">
        <div className="rounded-[28px] bg-white p-8 shadow-sm text-center max-w-md w-full border border-slate-100">
            <h2 className="text-xl font-bold text-[#0c1929] mb-3">Unable to load receipt</h2>
            <p className="text-[#0c1929] text-sm mb-6">{error}</p>
            <Link href="/trips" className="inline-flex w-full items-center justify-center rounded-full bg-[#0c1929] py-3.5 text-sm font-semibold text-white transition hover:bg-[#152b47]">
                Return to Trips
            </Link>
        </div>
      </div>
    );
  }

  const property = reservation.property || {};
  const start = new Date(reservation.startDate);
  const end = new Date(reservation.endDate);
  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
  
  const total = reservation.totalPrice || 0;
  
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const formatCurrency = (val) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 font-sans print:bg-white flex flex-col items-center py-10 px-4 sm:px-8">
      {/* Top action bar - hidden when printing */}
      <div className="w-full max-w-[800px] flex items-center justify-between mb-8 print:hidden">
        <Link 
            href="/trips" 
            className="flex items-center gap-2 text-sm font-semibold text-[#0c1929] hover:bg-slate-200 px-4 py-2 rounded-full transition"
        >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 text-sm font-semibold text-white bg-[#0c1929] hover:bg-[#152b47] px-6 py-2.5 rounded-full transition shadow-md"
        >
            <Download className="h-4 w-4" /> Download PDF / Print
        </button>
      </div>

      {/* Actual Receipt Page */}
      <div className="w-full max-w-[800px] bg-white rounded-[24px] print:rounded-none border border-slate-200 print:border-none shadow-[0_8px_30px_rgba(12,25,41,0.04)] print:shadow-none overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#0c1929] text-white px-8 py-10 flex items-center justify-between print:bg-[#0c1929] print:text-black print:border-b-4 print:border-slate-800">
            <div>
                <h1 className="text-3xl font-black tracking-tight mb-1 print:text-[#0c1929]">HomEV.</h1>
                <p className="text-white/70 text-sm font-medium tracking-wide print:text-slate-600">Official Receipt</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-white/80 font-medium mb-0.5 print:text-slate-600">Receipt ID</p>
                <p className="text-base font-bold uppercase tracking-wider print:text-[#0c1929]">{reservation.id.split("-")[0]}</p>
            </div>
        </div>

        <div className="p-8 sm:p-12">
            <div className="grid sm:grid-cols-2 gap-10 border-b border-slate-100 pb-10">
                {/* Guest Details */}
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0c1929] mb-3">Billed To</p>
                    <p className="text-lg font-bold text-[#0c1929]">
                        {reservation.guest ? `${reservation.guest.firstName || ""} ${reservation.guest.lastName || ""}`.trim() || "Guest" : "Guest"}
                    </p>
                    {reservation.guest?.email && <p className="text-sm text-[#0c1929] mt-1">{reservation.guest.email}</p>}
                    <p className="text-sm text-[#0c1929] mt-3 font-medium bg-slate-50 inline-block px-3 py-1 rounded-md border border-slate-200">
                        Paid via Secure Checkout
                    </p>
                </div>

                {/* Property Details */}
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0c1929] mb-3">Booking Details</p>
                    <div className="flex items-start gap-3">
                        <Home className="h-5 w-5 text-[#0c1929] shrink-0 mt-0.5" />
                        <div>
                            <p className="text-base font-bold text-[#0c1929]">{property.title || "HomEV Stay"}</p>
                            <p className="text-sm text-[#0c1929] mt-0.5 leading-snug">{property.address || property.location || "Location on file"}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dates */}
            <div className="py-8 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 bg-slate-50 px-5 py-4 rounded-xl border border-slate-100 flex-1 min-w-[200px]">
                    <Calendar className="h-6 w-6 text-[#0c1929]" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#0c1929]">Check-in</p>
                        <p className="text-base font-bold text-[#0c1929]">{fmtDate(start)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-5 py-4 rounded-xl border border-slate-100 flex-1 min-w-[200px]">
                    <Calendar className="h-6 w-6 text-[#0c1929]" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#0c1929]">Checkout</p>
                        <p className="text-base font-bold text-[#0c1929]">{fmtDate(end)}</p>
                    </div>
                </div>
                <div className="px-4 py-2">
                    <p className="text-lg font-black text-[#0c1929] text-center">{nights} Night{nights !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* Breakdown */}
            <div className="py-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0c1929] mb-5">Charges Breakdown</p>
                <div className="space-y-4">
                    <div className="flex justify-between text-sm font-medium text-[#0c1929]">
                        <span>Accommodation ({nights} nights)</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                    {reservation.selectedNonRefundable && (
                        <div className="flex justify-between text-sm font-medium text-emerald-600">
                            <span>Non-Refundable Discount Applied</span>
                            <span>Included</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm font-medium text-[#0c1929]">
                        <span>Taxes & Fees</span>
                        <span>Included</span>
                    </div>
                </div>
            </div>

            {/* Total */}
            <div className="mt-4 bg-slate-50 rounded-2xl p-6 border border-slate-200 flex items-center justify-between print:border-black print:bg-transparent print:border-2">
                <div>
                    <p className="text-sm font-bold text-[#0c1929]">Amount Paid</p>
                    <p className="text-[11px] font-medium text-[#0c1929] mt-0.5 flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5" /> Charged to card
                    </p>
                </div>
                <p className="text-3xl font-black text-[#0c1929]">{formatCurrency(total)}</p>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center border-t border-slate-100 pt-8">
                <p className="text-xs font-semibold text-[#0c1929] mb-1">Thank you for booking with HomEV!</p>
                <p className="text-[10px] font-medium text-[#0c1929]/70">If you have any questions about this receipt, please contact your host or HomEV support.</p>
                <p className="text-[10px] font-medium text-[#0c1929]/50 mt-4">Issued on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
        </div>

      </div>
    </div>
  );
}
