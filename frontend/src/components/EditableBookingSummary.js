"use client";

import { useState } from "react";
import { formatCurrency, formatDateRange } from "@/lib/booking";
import { Minus, Plus, X } from "lucide-react";
import AvailabilityCalendar from "./AvailabilityCalendar";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect } from "react";

export default function EditableBookingSummary({ listing, booking, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [checkIn, setCheckIn] = useState(booking.checkIn || "");
  const [checkOut, setCheckOut] = useState(booking.checkOut || "");
  const [guests, setGuests] = useState(Number(booking.guests) || 2);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = () => {
    const query = new URLSearchParams(searchParams);
    if (checkIn) query.set("checkIn", checkIn);
    if (checkOut) query.set("checkOut", checkOut);
    query.set("guests", String(guests));
    
    setIsOpen(false);
    router.push(`${pathname}?${query.toString()}`);
  };

  return (
    <div className="relative w-full">
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer group h-full w-full">
        {children}
      </div>

      {mounted && isOpen ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0c1929]/40 backdrop-blur-sm transition-opacity" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
          <div className="relative w-full max-w-[760px] rounded-[30px] bg-white shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-100/50 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0 bg-white z-20">
              <h3 className="text-base font-bold text-[#0c1929] tracking-tight">Select your dates & guests</h3>
              <button onClick={() => setIsOpen(false)} className="rounded-full bg-slate-100 p-1.5 text-[#0c1929] hover:bg-slate-200 hover:text-[#0c1929] transition">
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-6 bg-white shrink-0 scrollbar-hide">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <h4 className="mb-4 text-xs font-bold tracking-[0.2em] text-[#0c1929] uppercase">Choose dates</h4>
                  <div className="rounded-[24px] border border-slate-200 p-4 shadow-sm shadow-slate-100 overflow-hidden h-full flex items-center">
                    <div className="mx-auto max-w-full">
                      <AvailabilityCalendar 
                        blockedDates={listing?.blockedDates || []} 
                        checkIn={checkIn} 
                        checkOut={checkOut} 
                        onCheckInChange={setCheckIn}
                        onCheckOutChange={setCheckOut}
                        minNights={listing?.minNights}
                        calendarMinStays={listing?.calendarMinStays || {}}
                      />
                    </div>
                  </div>
                </div>

                <div className="md:w-[300px] flex flex-col justify-between space-y-6 md:space-y-0">
                  <div>
                    <h4 className="mb-4 text-xs font-bold tracking-[0.2em] text-[#0c1929] uppercase">Guests</h4>
                    <div className="flex items-center justify-between rounded-[24px] border border-slate-200 p-5 shadow-sm shadow-slate-100">
                      <div className="flex flex-col gap-1">
                        <p className="font-bold text-[#0c1929] tracking-tight text-sm">Adults & Children</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-200 text-[#0c1929] hover:border-[#0c1929] hover:text-[#0c1929] disabled:opacity-40 disabled:hover:border-slate-200 transition">
                          <Minus className="h-4 w-4" strokeWidth={3} />
                        </button>
                        <span className="w-5 text-center text-lg font-bold text-[#0c1929] tracking-tight">{guests}</span>
                        <button onClick={() => setGuests(Math.min(listing?.maxGuests || 6, guests + 1))} disabled={guests >= (listing?.maxGuests || 6)} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-200 text-[#0c1929] hover:border-[#0c1929] hover:text-[#0c1929] disabled:opacity-40 disabled:hover:border-slate-200 transition">
                          <Plus className="h-4 w-4" strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-auto">
                    <button onClick={handleSave} className="w-full rounded-[20px] bg-[#0c1929] py-4 text-base font-bold text-white shadow-lg shadow-[#0c1929]/20 transition hover:bg-[#152b47] active:scale-[0.98]">
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
