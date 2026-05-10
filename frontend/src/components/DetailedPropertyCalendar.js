"use client";

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Settings2, MoreHorizontal, ChevronLeft, ChevronRight, TrendingUp, Banknote } from 'lucide-react';

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DetailedPropertyCalendar({ property, bookings = [], onClose }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  // Calendar logic
  const { weeks, flatDays } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    
    // Find the previous month's trailing days
    const startDate = new Date(year, month, 1 - startingDayOfWeek);
    
    const weeksArr = [];
    const flatDaysArr = [];
    
    let currentDate = new Date(startDate);
    
    // Generate exactly 6 weeks to always fill the grid consistently
    for (let w = 0; w < 6; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(currentDate);
        week.push(dateObj);
        flatDaysArr.push(dateObj);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeksArr.push(week);
      
      // If we've finished the current month, we can stop adding weeks
      if (w >= 3 && week[6].getMonth() !== month && week[6].getFullYear() >= year) {
        break; // Sometimes 4 or 5 weeks is enough
      }
    }
    
    return { weeks: weeksArr, flatDays: flatDaysArr };
  }, [currentMonth]);

  const blockedSet = useMemo(() => {
    return new Set(property?.blockedDates || []);
  }, [property?.blockedDates]);

  // Strip time for comparison
  const normalizeDate = (d) => {
    const c = new Date(d);
    c.setHours(0,0,0,0);
    return c;
  };

  const getIso = (d) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getIso(new Date());

  // Convert bookings into standardized spanning events
  const events = useMemo(() => {
    const dbEvents = bookings.map(b => ({
      id: b.id,
      guest: b.guest,
      amount: b.amount,
      start: normalizeDate(b.start),
      end: normalizeDate(b.end),
      channel: b.channel,
      isExternal: false
    }));

    // Group blocked dates into external events
    const blockedEvents = [];
    if (property?.blockedDates && property.blockedDates.length > 0) {
      const sortedDates = [...property.blockedDates].map(d => normalizeDate(d)).sort((a, b) => a - b);
      let cStart = sortedDates[0];
      let cEnd = sortedDates[0];
      
      for (let i = 1; i < sortedDates.length; i++) {
        if (sortedDates[i] - cEnd === 86400000) { // consecutive day
          cEnd = sortedDates[i];
        } else {
          // If a date is blocked but we already have a real DB booking overlapping it, don't double-render
          const overlapsDb = dbEvents.some(dbE => cStart >= dbE.start && cStart < dbE.end);
          if (!overlapsDb) {
            blockedEvents.push({
              id: `ext-${cStart.getTime()}`,
              guest: 'Uplisting Booking',
              amount: null,
              start: cStart,
              // Blocked dates in Uplisting are nightly. A blocked night means check-out is the NEXT day.
              end: new Date(cEnd.getTime() + 86400000), 
              channel: 'External',
              isExternal: true
            });
          }
          cStart = sortedDates[i];
          cEnd = sortedDates[i];
        }
      }
      const overlapsDbFinal = dbEvents.some(dbE => cStart >= dbE.start && cStart < dbE.end);
      if (!overlapsDbFinal) {
        blockedEvents.push({
          id: `ext-${cStart.getTime()}`,
          guest: 'Uplisting Booking',
          amount: null,
          start: cStart,
          end: new Date(cEnd.getTime() + 86400000),
          channel: 'External',
          isExternal: true
        });
      }
    }

    return [...dbEvents, ...blockedEvents];
  }, [bookings, property?.blockedDates]);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          
          <div className="w-14 h-12 bg-slate-200 rounded-lg overflow-hidden bg-cover bg-center shrink-0" 
               style={{backgroundImage: `url(${property?.images?.[0] || 'https://images.unsplash.com/photo-1554995207-c18c203602cb'})`}}>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {property?.nickname || property?.title || property?.name || 'Loading Property...'}
              </h1>
              <ChevronDownIcon className="w-4 h-4 text-slate-400" />
            </div>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-700 underline decoration-slate-300 underline-offset-2">View Details</a>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded shadow-sm transition text-slate-700">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="font-bold text-slate-800 min-w-[120px] text-center text-sm">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded shadow-sm transition text-slate-700">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-white z-10 shrink-0">
        {WEEK_DAYS.map((day, idx) => (
          <div key={day} className="py-2.5 text-center text-xs font-bold text-slate-500 tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="flex-1 overflow-y-auto bg-white hidden-scrollbar flex flex-col relative">
        {weeks.map((week, weekIdx) => (
          <div key={`week-${weekIdx}`} className="flex border-b border-slate-200 relative min-h-[140px]">
            
            {/* Day Backgrounds & Cells */}
            {week.map((day, dayIdx) => {
              const iso = getIso(day);
              const isBlocked = blockedSet.has(iso);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isPast = iso < todayStr;
              
              const spotRate = property?.calendarRates?.[iso] || property?.pricePerNight || property?.price || 306;
              const directRate = spotRate; // Fallback same as spot if no separate direct rate

              return (
                <div 
                  key={iso} 
                  className={`flex-1 border-r border-slate-100 flex flex-col relative ${!isCurrentMonth ? 'bg-slate-50/50 opacity-60' : 'bg-white'}`}
                >
                  {/* Blocked Background Diagonal Stripes */}
                  {isBlocked && (
                     <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.03)_10px,rgba(0,0,0,0.03)_20px)] pointer-events-none" />
                  )}

                  {/* Date Number */}
                  <div className="p-2 z-10">
                    <span className={`text-sm font-bold ${isPast ? 'text-slate-400' : 'text-slate-700'}`}>
                      {String(day.getDate()).padStart(2, '0')}
                    </span>
                  </div>
                  
                  <div className="flex-1"></div>

                  {/* Pricing info at bottom */}
                  <div className="p-2 flex flex-col gap-1 z-10 bg-white/50 backdrop-blur-sm mt-auto">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      ${spotRate}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Banknote className="w-3.5 h-3.5 text-slate-500" />
                      ${directRate}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Event Pills Overlaying this week */}
            {(() => {
              const weekStart = week[0];
              const weekEnd = week[6];
              
              // Find events overlapping this week
              const weekEvents = events.filter(e => e.start <= weekEnd && e.end > weekStart); // strictly > weekStart for end because checkout day is not booked night typically
              
              // Sort events by start date to stack them predictably
              weekEvents.sort((a, b) => a.start - b.start);

              return weekEvents.map((ev, evIdx) => {
                // Calculate span within this week
                const renderStart = ev.start < weekStart ? weekStart : ev.start;
                const renderEnd = ev.end > weekEnd ? weekEnd : ev.end; // wait, end is checkout day. Should we draw up to checkout?
                // If checkout is on Tuesday, we only draw covering Sunday and Monday (nights). 
                // BUT in standard calendars (like Airbnb host calendar), the checkout day IS partially covered by the pill. The pill ends halfway on the checkout day.
                // Let's draw it spanning strictly by days.
                
                const startIndex = Math.max(0, Math.floor((renderStart - weekStart) / 86400000));
                
                // End index calculation. If checkout is on Thursday (index 4), duration should be to index 4.
                const endIndex = Math.min(6, Math.floor((renderEnd - weekStart) / 86400000));
                
                const spanDays = (endIndex - startIndex) + 1; // +1 to cover the start and end days visually
                
                // Adjust visually to end halfway through checkout cell and start halfway through checkin cell if desired, 
                // but for simplicity, let's span the full width, or full width minus padding.
                const leftPercent = (startIndex / 7) * 100;
                const widthPercent = (spanDays / 7) * 100;
                
                // Visual tweaks for borders if continuing from prev week or next week
                const isContinuingFromPrev = ev.start < weekStart;
                const isContinuingToNext = ev.end > weekEnd;

                // Stacking offset (if multiple events overlap, push them down)
                const topOffset = 36 + (evIdx * 34);

                return (
                  <div 
                    key={`${ev.id}-${weekIdx}`}
                    className={`absolute z-20 flex items-center h-8 shadow-[0_2px_4px_rgba(0,0,0,0.02)]
                      ${ev.isExternal ? 'bg-slate-100 border-y border-slate-300/80' : 'bg-indigo-50 border-y border-indigo-200/80'}
                      ${isContinuingFromPrev ? 'border-l-0 rounded-l-none' : 'border-l rounded-l-full ml-1'}
                      ${isContinuingToNext ? 'border-r-0 rounded-r-none' : 'border-r rounded-r-full mr-1'}
                    `}
                    style={{
                      left: `calc(${leftPercent}% ${isContinuingFromPrev ? '' : '+ 4px'})`,
                      width: `calc(${widthPercent}% - ${isContinuingFromPrev ? 0 : 4}px - ${isContinuingToNext ? 0 : 4}px)`,
                      top: `${topOffset}px`
                    }}
                  >
                    {!isContinuingFromPrev && (
                       <div className={`${ev.isExternal ? 'bg-slate-500' : 'bg-[#FF5A5F]'} text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0 ml-1.5 shadow-sm`}>
                         {ev.isExternal ? <GlobeIcon /> : <AirbnbIcon />}
                       </div>
                    )}
                    
                    <div className="flex items-center overflow-hidden whitespace-nowrap ml-2 mr-3 text-[13px] font-bold text-slate-800">
                      <span className="truncate">{ev.guest}</span>
                      {ev.amount !== null && (
                        <span className="ml-1 opacity-70 font-semibold text-slate-600">${ev.amount}</span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}

          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hidden-scrollbar::-webkit-scrollbar { display: none; }
        .hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

function ChevronDownIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  )
}

function AirbnbIcon() {
  // Simplified Airbnb-like logo using SVG path for visual parity with screenshot
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M12.015 1.5c-1.3 0-2.427.674-3.326 1.83-2.673 3.447-4.225 7.025-4.225 10.74 0 3.738 2.766 6.43 6.31 6.43 1.54 0 2.923-.62 4.04-1.78l1.202-1.258 1.201 1.258c1.117 1.16 2.5 1.78 4.04 1.78 3.544 0 6.31-2.692 6.31-6.43 0-3.715-1.552-7.293-4.225-10.74C14.442 2.174 13.315 1.5 12.015 1.5zm0 2.441c.642 0 1.293.424 1.94 1.258 2.378 3.064 3.743 6.22 3.743 9.491 0 2.457-1.782 4.195-4.103 4.195-1.025 0-1.927-.47-2.69-1.267l-2.072-2.17-2.072 2.17c-.763.796-1.665 1.267-2.69 1.267-2.321 0-4.103-1.738-4.103-4.195 0-3.27 1.365-6.427 3.743-9.49.647-.835 1.298-1.259 1.94-1.259h.364zm0 6.136c-1.597 0-2.893 1.3-2.893 2.905 0 1.606 1.296 2.906 2.893 2.906s2.893-1.3 2.893-2.906c0-1.605-1.296-2.905-2.893-2.905zm0 1.745c.638 0 1.155.521 1.155 1.16 0 .64-.517 1.161-1.155 1.161-.638 0-1.155-.521-1.155-1.161 0-.639.517-1.16 1.155-1.16z"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      <path d="M2 12h20"/>
    </svg>
  );
}
