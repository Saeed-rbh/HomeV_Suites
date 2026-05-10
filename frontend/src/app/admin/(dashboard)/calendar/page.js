"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ChevronLeft, ChevronRight, Filter, Search, Eye, 
    CalendarDays, RefreshCw, Maximize, Share, SlidersHorizontal, ChevronDown, ChevronUp
} from 'lucide-react';
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import DetailedPropertyCalendar from "@/components/DetailedPropertyCalendar";

export default function MultiHostCalendar() {
    const [properties, setProperties] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [startDate, setStartDate] = useState(new Date());
    const [expandedRows, setExpandedRows] = useState({});
    const [selectedCalendars, setSelectedCalendars] = useState(['all']);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [selectedPropertyForCalendar, setSelectedPropertyForCalendar] = useState(null);
    const timelineRef = useRef(null);
    
    // Simulate 30 days of view for now
    const daysToShow = 30;

    useEffect(() => {
        Promise.all([
            fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/properties').then(res => res.json()),
            fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/reservations').then(res => res.json())
        ])
        .then(([propsRes, resRes]) => {
            if (propsRes.success && propsRes.data) {
                setProperties(propsRes.data);
                
                const initialExpanded = {};
                propsRes.data.forEach(p => initialExpanded[p.id] = true);
                setExpandedRows(initialExpanded);
            }
            if (resRes.success && resRes.data) {
                const realBookings = resRes.data.map(b => ({
                    id: b.id,
                    guest: b.guestName || (b.guest ? `${b.guest.firstName} ${b.guest.lastName}` : "Guest"),
                    start: b.startDate || b.checkInDate,
                    end: b.endDate || b.checkOutDate,
                    channel: b.channel || "HomEV Direct",
                    amount: b.totalPrice,
                    propertyId: b.propertyId
                }));
                setBookings(realBookings);
            }
        })
        .catch(err => console.error("Error fetching live calendar data:", err));
    }, []);

    const toggleRow = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const nextDays = () => {
        const next = new Date(startDate);
        next.setMonth(next.getMonth() + 1);
        setStartDate(next);
        if (timelineRef.current) timelineRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    };

    const prevDays = () => {
        const prev = new Date(startDate);
        prev.setMonth(prev.getMonth() - 1);
        setStartDate(prev);
        if (timelineRef.current) timelineRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    };

    const setToday = () => {
        setStartDate(new Date());
        if (timelineRef.current) timelineRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    };

    const handleJumpToDate = (isoDateStr) => {
        if (isoDateStr) {
            const next = new Date(isoDateStr + "T12:00:00");
            next.setHours(0,0,0,0);
            setStartDate(next);
            setIsDatePickerOpen(false);
            if (timelineRef.current) timelineRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        }
    };

    const dates = useMemo(() => {
        return Array.from({ length: daysToShow }).map((_, i) => {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            d.setHours(0, 0, 0, 0); // normalize
            return d;
        });
    }, [startDate, daysToShow]);

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden text-[#0c1929] text-sm">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="w-4 h-4 text-[#0c1929] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Search for guest name or booking code..." 
                            className="pl-9 pr-4 py-2 bg-slate-100 rounded-full text-sm outline-none w-80 border border-transparent focus:border-slate-300 transition"
                        />
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button onClick={() => setIsViewOpen(!isViewOpen)} className="flex items-center gap-2 font-medium text-sm px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                            <Eye className="w-4 h-4 text-[#0c1929]" /> 
                            Calendar Views ({selectedCalendars.includes('all') ? 'All' : selectedCalendars.length})
                            <ChevronDown className="w-4 h-4 text-[#0c1929]" />
                        </button>
                        
                        {isViewOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 shadow-xl rounded-xl p-2 z-50">
                                <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer text-sm font-bold text-[#0c1929]">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedCalendars.includes('all')}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedCalendars(['all']);
                                            else setSelectedCalendars([]);
                                        }}
                                        className="rounded border-slate-300 w-4 h-4 accent-[#0c1929]"
                                    /> 
                                    All Calendars
                                </label>
                                <div className="h-px bg-slate-100 my-1"></div>
                                <div className="max-h-60 overflow-y-auto hidden-scrollbar">
                                    {properties.map(p => (
                                        <label key={`sel-${p.id}`} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer text-sm text-[#0c1929] font-medium">
                                            <input 
                                                type="checkbox" 
                                                checked={!selectedCalendars.includes('all') && selectedCalendars.includes(p.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        const next = selectedCalendars.filter(x => x !== 'all');
                                                        setSelectedCalendars([...next, p.id]);
                                                    } else {
                                                        const next = selectedCalendars.filter(x => x !== p.id);
                                                        setSelectedCalendars(next.length === 0 ? ['all'] : next);
                                                    }
                                                }}
                                                className="rounded border-slate-300 w-4 h-4 accent-[#0c1929]"
                                            /> 
                                            {p.nickname || p.neighborhood || p.title || p.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center rounded-lg border border-slate-200 shadow-sm bg-white overflow-hidden p-0.5">
                        <button onClick={prevDays} className="p-1.5 rounded-md hover:bg-slate-100 transition text-[#0c1929]">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div 
                            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)} 
                            className="flex items-center justify-center gap-2 px-3 font-semibold text-[#0c1929] text-sm cursor-pointer select-none min-w-[140px] hover:text-emerald-600 transition"
                        >
                            <CalendarDays className="w-4 h-4 text-emerald-600" /> 
                            {dates[0].toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </div>
                        <button onClick={nextDays} className="p-1.5 rounded-md hover:bg-slate-100 transition text-[#0c1929]">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <button onClick={setToday} className="px-4 py-1.5 border border-slate-200 hover:border-slate-300 font-medium rounded-lg">
                        Today
                    </button>
                </div>
            </div>

            {/* Sub Filter Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100">
                <button className="flex items-center gap-1 font-semibold text-[#0c1929]">
                    <Filter className="w-4 h-4" /> Filter
                </button>
                <div className="ml-4 font-medium text-[#0c1929]">
                    Properties ({properties.length})
                </div>
            </div>

            {/* Calendar Main Grid Area */}
            <div ref={timelineRef} className="flex-1 overflow-auto bg-white hidden-scrollbar flex flex-col relative">
                
                {/* Global Date Picker Overlay */}
                {isDatePickerOpen && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-[60] bg-white rounded-[30px] shadow-2xl border border-slate-200 w-full max-w-4xl p-2 mt-4">
                        <AvailabilityCalendar 
                            blockedDates={[]} // Allow jumping to any date
                            onCheckInChange={handleJumpToDate}
                            showClearDates={false}
                            onClose={() => setIsDatePickerOpen(false)}
                        />
                    </div>
                )}
                <div className="min-w-max flex flex-col">
                    {/* Header Row */}
                    <div className="flex border-b border-slate-200 sticky top-0 z-40 bg-white shadow-sm">
                        <div className="w-[320px] flex-shrink-0 border-r border-slate-200 sticky left-0 z-50 bg-white h-14 flex items-center px-4"></div>
                        <div className="flex h-14">
                            {dates.map((d, i) => {
                                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                const isToday = new Date().toDateString() === d.toDateString();
                                return (
                                    <div key={i} className={`flex-shrink-0 w-24 flex flex-col items-center justify-center border-r border-slate-200 ${isToday ? 'bg-slate-50' : ''}`}>
                                        <div className="text-xs font-medium text-[#0c1929]">{d.toLocaleString('default', { weekday: 'short' })}</div>
                                        <div className={`font-bold text-sm ${isToday ? 'bg-emerald-800 text-white w-6 h-6 rounded-full flex items-center justify-center' : isWeekend ? 'text-[#0c1929]' : 'text-[#0c1929]'}`}>
                                            {d.getDate()} <span className={isToday ? "hidden" : `font-normal text-xs ${isWeekend ? 'text-[#0c1929]' : 'text-[#0c1929]'} ml-0.5`}>{d.toLocaleString('default', { month: 'short' })}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Property Rows */}
                    {properties.filter(p => selectedCalendars.includes('all') || selectedCalendars.includes(p.id)).map(p => {
                        const pBookings = bookings.filter(b => b.propertyId === p.id);
                        
                        return (
                            <div key={`prop-row-${p.id}`} className="flex border-b border-slate-200">
                                {/* Left Side: Property Header */}
                                <div className="w-[320px] flex-shrink-0 border-r border-slate-200 sticky left-0 z-30 bg-white flex flex-col">
                                    <div className="flex items-center justify-between p-3 min-h-[96px] bg-slate-50/50">
                                        <div 
                                            className="flex gap-3 items-center cursor-pointer hover:opacity-80 transition"
                                            onClick={() => setSelectedPropertyForCalendar(p)}
                                        >
                                            <div className="w-16 h-12 bg-slate-200 rounded-md overflow-hidden bg-cover bg-center flex-shrink-0" style={{backgroundImage: `url(${p.images?.[0] || 'https://images.unsplash.com/photo-1554995207-c18c203602cb'})`}}></div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-[#0c1929] text-base truncate">{p.nickname || p.neighborhood || p.title || p.name}</div>
                                                <div className="text-xs font-semibold text-emerald-600 tracking-wide mt-1">Detailed calendar</div>
                                            </div>
                                        </div>
                                        <button onClick={() => toggleRow(p.id)} className="p-1 hover:bg-slate-200 rounded">
                                            {expandedRows[p.id] ? <ChevronUp className="w-5 h-5 text-[#0c1929]" /> : <ChevronDown className="w-5 h-5 text-[#0c1929]" />}
                                        </button>
                                    </div>
                                    
                                    {expandedRows[p.id] && (
                                        <div className="flex flex-col text-xs font-medium text-[#0c1929] bg-white">
                                            <div className="h-8 flex items-center px-4 border-t border-slate-100 gap-2"><span className="text-[#0c1929]">🛏️</span> Minimum length of stay</div>
                                            <div className="h-8 flex items-center px-4 border-t border-slate-100 gap-2"><span className="text-blue-500">U</span> Uplisting rate</div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Timeline */}
                                <div className="flex-1 flex flex-col">
                                    <div className="flex min-h-[96px] bg-slate-50/20 relative">
                                        {/* Background Grid Lines */}
                                        {dates.map((d, i) => (
                                            <div key={`grid-${i}`} className="flex-shrink-0 w-24 border-r border-slate-200 h-full relative group">
                                            </div>
                                        ))}

                                        {/* Bookings overlays */}
                                        {pBookings.map(b => {
                                            const bStart = new Date(b.start);
                                            bStart.setHours(0,0,0,0);
                                            const bEnd = new Date(b.end);
                                            bEnd.setHours(0,0,0,0);
                                            
                                            const viewStart = dates[0];
                                            const viewEnd = dates[dates.length - 1];

                                            if (bEnd < viewStart || bStart > viewEnd) return null;

                                            const offsetDays = (bStart - viewStart) / 86400000;
                                            const durationDays = (bEnd - bStart) / 86400000 + 1; // inclusive pill

                                            const leftPx = Math.max(0, offsetDays * 96); // 96px = w-24
                                            const widthPx = durationDays * 96;
                                            
                                            const pillColor = 'bg-red-50 text-red-700 border-red-200';
                                            const icon = <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">H</span>;

                                            return (
                                                <div 
                                                    key={b.id} 
                                                    className={`absolute top-4 h-8 ${pillColor} border rounded-full px-2 py-1 shadow-sm flex items-center gap-1.5 overflow-hidden font-medium text-xs whitespace-nowrap z-10`}
                                                    style={{ left: `${leftPx + 8}px`, width: `${widthPx - 16}px` }}
                                                >
                                                    {icon}
                                                    <span className="truncate">{b.guest} <b>${b.amount}</b></span>
                                                </div>
                                            )
                                        })}
                                        
                                        {/* Background sync pills like "Imported from Airbnb" */}
                                        <div className="absolute inset-0 pointer-events-none z-0">
                                            {(() => {
                                                if (!p.blockedDates || p.blockedDates.length === 0) return null;
                                                const pills = [];
                                                const sortedDates = [...p.blockedDates].map(d => new Date(d)).sort((a,b) => a - b);
                                                let cStart = sortedDates[0];
                                                let cEnd = sortedDates[0];
                                                
                                                for (let i = 1; i < sortedDates.length; i++) {
                                                    if (sortedDates[i] - cEnd === 86400000) {
                                                        cEnd = sortedDates[i];
                                                    } else {
                                                        pills.push({start: cStart, end: cEnd});
                                                        cStart = sortedDates[i];
                                                        cEnd = sortedDates[i];
                                                    }
                                                }
                                                pills.push({start: cStart, end: cEnd});
                                                
                                                return pills.map((pill, idx) => {
                                                    const viewStart = dates[0];
                                                    const viewEnd = dates[dates.length - 1];
                                                    if (pill.end < viewStart || pill.start > viewEnd) return null;
                                                    
                                                    const offsetDays = (pill.start - viewStart) / 86400000;
                                                    const durationDays = (pill.end - pill.start) / 86400000 + 1;
                                                    
                                                    const leftPx = Math.max(0, offsetDays * 96);
                                                    const widthPx = durationDays * 96;
                                                    
                                                    return (
                                                        <div 
                                                            key={`block-${idx}`} 
                                                            className="absolute bottom-2 h-6 bg-slate-300/60 rounded border border-[#0c1929] px-2 flex items-center justify-center text-[11px] font-bold text-[#0c1929] shadow-sm"
                                                            style={{ left: `${leftPx + 8}px`, width: `${widthPx - 16}px` }}
                                                        >
                                                            Imported from Uplisting
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                    
                                    {/* Expandable Metrics Tracks */}
                                    {expandedRows[p.id] && (
                                        <div className="flex flex-col bg-white">
                                            {/* Minimum length of stay */}
                                            <div className="flex h-8 border-t border-slate-100">
                                                {dates.map((d, i) => {
                                                    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                                                    const minLOS = p.calendarMinStays?.[iso] || p.minStay || 2;
                                                    return (
                                                        <div key={`min-${i}`} className="flex-shrink-0 w-24 border-r border-slate-200 flex items-center px-3 text-xs text-[#0c1929] font-medium">
                                                            {minLOS}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {/* Uplisting Rate */}
                                            <div className="flex h-8 border-t border-slate-100">
                                                {dates.map((d, i) => {
                                                    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                                                    const spotRate = p.calendarRates?.[iso] || p.pricePerNight || p.price || 240;
                                                    return (
                                                        <div key={`air-${i}`} className="flex-shrink-0 w-24 border-r border-slate-200 flex items-center px-3 text-xs text-[#0c1929] font-medium">
                                                            ${spotRate}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            
            {/* Property Specific Calendar Overlay */}
            {selectedPropertyForCalendar && (
                <DetailedPropertyCalendar 
                    property={selectedPropertyForCalendar}
                    bookings={bookings.filter(b => b.propertyId === selectedPropertyForCalendar.id)}
                    onClose={() => setSelectedPropertyForCalendar(null)}
                />
            )}
            
            <style jsx global>{`
                .hidden-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hidden-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
