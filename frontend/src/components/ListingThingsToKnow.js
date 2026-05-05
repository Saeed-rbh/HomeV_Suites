"use client";

import { useState, useEffect } from "react";
import { 
  ChevronRight, X, ShieldCheck, ListChecks, CalendarX,
  Clock, Home, FileText, AlertTriangle, Shield
} from "lucide-react";
import { useSearchParams } from "next/navigation";

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#0c1929]/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-3xl transform overflow-hidden rounded-[24px] bg-white p-8 text-left shadow-2xl transition-all max-h-[85vh] flex flex-col">
        <button onClick={onClose} className="absolute left-6 top-6 rounded-full p-2 hover:bg-slate-100 transition z-10">
          <X className="h-5 w-5 text-[#0c1929]" />
        </button>
        <div className="mt-8 flex-1 overflow-y-auto">
          <h2 className="text-[28px] font-bold tracking-tight text-[#0c1929] mb-8">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}

// Helper to format Date like "Apr 29"
function formatPolicyDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

export default function ListingThingsToKnow({ thingsToKnow, checkIn, cancellationDays = 5, cancellationDescription, cancellationPolicy }) {
  const [modalType, setModalType] = useState(null);
  const searchParams = useSearchParams();
  const searchCheckIn = searchParams.get("checkin") || checkIn;
  const [activeCheckIn, setActiveCheckIn] = useState(searchCheckIn);
  const [activeNonRefundable, setActiveNonRefundable] = useState(false);

  useEffect(() => {
    setActiveCheckIn(searchCheckIn);
  }, [searchCheckIn]);

  useEffect(() => {
    const handleSync = (e) => setActiveCheckIn(e.detail);
    const handleSyncNonRef = (e) => setActiveNonRefundable(e.detail);
    window.addEventListener('syncCheckIn', handleSync);
    window.addEventListener('syncNonRefundable', handleSyncNonRef);
    return () => {
      window.removeEventListener('syncCheckIn', handleSync);
      window.removeEventListener('syncNonRefundable', handleSyncNonRef);
    };
  }, []);
  
  if (!thingsToKnow) return null;

  // Dynamic Policy calculation based on checkIn
  const baseDate = activeCheckIn ? new Date(activeCheckIn + "T15:00:00") : new Date(Date.now() + 21 * 86400000);
  
  let dynamicCancellationPolicy = {
    summary: cancellationDescription || "Review this host’s full policy for details.",
    details: "",
    timeline: []
  };

  const nights = checkIn && searchParams.get("checkout") 
    ? Math.round((new Date(searchParams.get("checkout")).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 1;

  const activeCancellationPolicy = (nights >= 28 && cancellationPolicy?.longTerm) 
    ? cancellationPolicy.longTerm 
    : (cancellationPolicy?.shortTerm || cancellationPolicy);

  if (activeCancellationPolicy) {
    const fullRefundDate = new Date(baseDate);
    fullRefundDate.setDate(baseDate.getDate() - activeCancellationPolicy.fullRefundDaysPrior);
    const formattedFull = formatPolicyDate(fullRefundDate);

    dynamicCancellationPolicy.summary = `Free cancellation before ${formattedFull}.`;
    dynamicCancellationPolicy.details = `Cancel before ${formattedFull} for a full refund.`;

    // Phase 1: Full Refund
    dynamicCancellationPolicy.timeline.push({
      phase: "Before",
      date: formattedFull,
      time: "3:00 p.m.",
      title: "Full refund",
      description: `Full refund if cancelled before 3:00 p.m. on ${formattedFull}. Get back 100% of what you paid.`
    });

    // Phase 2: Partial Refund (if applicable)
    if (activeCancellationPolicy.partialRefundDaysPrior > 0) {
      const partialRefundDate = new Date(baseDate);
      partialRefundDate.setDate(baseDate.getDate() - activeCancellationPolicy.partialRefundDaysPrior);
      const formattedPartial = formatPolicyDate(partialRefundDate);

      dynamicCancellationPolicy.timeline.push({
        phase: "Between",
        date: `${formattedFull} - ${formattedPartial}`,
        time: "3:00 p.m.",
        title: "Partial refund",
        description: `Get a ${activeCancellationPolicy.partialRefundPercentage}% refund if you cancel between these dates.`
      });

      dynamicCancellationPolicy.timeline.push({
        phase: "After",
        date: formattedPartial,
        time: "3:00 p.m.",
        title: "No refund",
        description: `This reservation is non-refundable after 3:00 p.m. on ${formattedPartial}.`
      });
    } else {
      dynamicCancellationPolicy.timeline.push({
        phase: "After",
        date: formattedFull,
        time: "3:00 p.m.",
        title: "No refund",
        description: `This reservation is non-refundable after 3:00 p.m. on ${formattedFull}.`
      });
    }

    // Override if non-refundable option is chosen
    if (activeNonRefundable) {
      dynamicCancellationPolicy.summary = "This option is non-refundable.";
      dynamicCancellationPolicy.details = "Cancel within 48 hours to get a full refund based on the host's grace period. After that, no refund is provided.";
      dynamicCancellationPolicy.timeline = [
        {
          phase: "After booking",
          date: "Before 48 hrs",
          time: "",
          title: "Full refund",
          description: "Full refund within 48 hours of booking (provided check-in is at least a week away)."
        },
        {
          phase: "After",
          date: "48 hrs",
          time: "",
          title: "No refund",
          description: "This option is strictly non-refundable past the short grace period, earning you a discounted rate."
        }
      ];
    }

    // Grace Period Info
    if (activeCancellationPolicy.bookingGracePeriodHours > 0) {
      dynamicCancellationPolicy.details += ` Note: Bookings include a ${activeCancellationPolicy.bookingGracePeriodHours}-hour grace period with full refund.`;
    }
  } else {
    // Fallback if no DB policy
    const freeDeadline = new Date(baseDate);
    freeDeadline.setDate(baseDate.getDate() - cancellationDays);
    const formattedFree = formatPolicyDate(freeDeadline);

    dynamicCancellationPolicy.summary = `Free cancellation before ${formattedFree}.`;
    dynamicCancellationPolicy.details = cancellationDescription || "Review this host’s full policy for details.";
    dynamicCancellationPolicy.timeline = [
      {
        phase: "Before",
        date: formattedFree,
        time: "3:00 p.m.",
        title: "Full refund",
        description: cancellationDescription || `Full refund if cancelled before 3:00 p.m. on ${formattedFree}.`
      },
      {
        phase: "After",
        date: formattedFree,
        time: "3:00 p.m.",
        title: "No refund",
        description: `No refund if cancelled after 3:00 p.m. on ${formattedFree}.`
      }
    ];
  }

  return (
    <>
      <section className="border-t border-slate-200 pt-12 pb-12 mt-4">
        
        <div className="grid gap-6 md:grid-cols-3 items-stretch">
          {/* House Rules Card */}
          {thingsToKnow.houseRules && thingsToKnow.houseRules.summary && (
            <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <ListChecks className="w-6 h-6 text-[#0c1929]" />
                </div>
                <h3 className="font-bold text-[#0c1929] text-[18px]">House rules</h3>
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                {thingsToKnow.houseRules.summary.slice(0, 4).map((rule, idx) => (
                  <li key={idx} className="text-[#0c1929] text-[15px] leading-tight">{rule}</li>
                ))}
              </ul>
              <button 
                onClick={() => setModalType('rules')} 
                className="flex items-center font-bold text-[#0c1929] text-[15px] hover:text-[#0c1929] transition group w-fit"
              >
                <span className="border-b-2 border-[#0c1929] group-hover:border-transparent transition-colors pb-0.5">Show more</span>
                <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Safety & property Card */}
          {thingsToKnow.safety && thingsToKnow.safety.summary && (
            <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-[#0c1929]" />
                </div>
                <h3 className="font-bold text-[#0c1929] text-[18px]">Safety & property</h3>
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                {thingsToKnow.safety.summary.slice(0, 4).map((rule, idx) => (
                  <li key={idx} className="text-[#0c1929] text-[15px] leading-tight">{rule}</li>
                ))}
              </ul>
              <button 
                onClick={() => setModalType('safety')} 
                className="flex items-center font-bold text-[#0c1929] text-[15px] hover:text-[#0c1929] transition group w-fit"
              >
                <span className="border-b-2 border-[#0c1929] group-hover:border-transparent transition-colors pb-0.5">Show more</span>
                <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Cancellation policy Card */}
          {thingsToKnow.cancellationPolicy && (
            <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <CalendarX className="w-6 h-6 text-[#0c1929]" />
                </div>
                <h3 className="font-bold text-[#0c1929] text-[18px]">Cancellation policy</h3>
              </div>
              <div className="space-y-3 mb-6 flex-1">
                <p className="text-[#0c1929] text-[15px] leading-tight">
                  {dynamicCancellationPolicy.summary}
                </p>
                <p className="text-[#0c1929] text-[15px] leading-tight">
                  {dynamicCancellationPolicy.details}
                </p>
              </div>
              {dynamicCancellationPolicy.timeline && (
                <button 
                  onClick={() => setModalType('cancellation')} 
                  className="flex items-center font-bold text-[#0c1929] text-[15px] hover:text-[#0c1929] transition group w-fit"
                >
                  <span className="border-b-2 border-[#0c1929] group-hover:border-transparent transition-colors pb-0.5">Learn more</span>
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <Modal 
        isOpen={modalType !== null} 
        onClose={() => setModalType(null)} 
        title={
          modalType === 'rules' ? 'House rules' : 
          modalType === 'safety' ? 'Safety & property' : 
          'Cancellation policy'
        }
      >
        {modalType === 'rules' && thingsToKnow.houseRules && (
          <div className="space-y-10 pl-2">
            <p className="text-[#0c1929] leading-snug text-[15px]">
              You'll be staying in someone's home, so please treat it with care and respect.
            </p>

            <div>
              <h3 className="flex items-center gap-2 font-semibold text-[#0c1929] text-[18px] mb-6">
                <Clock className="w-5 h-5 text-[#0c1929]" /> Checking in and out
              </h3>
              <ul className="space-y-4">
                {thingsToKnow.houseRules.checkingInAndOut.map((rule, idx) => (
                  <li key={idx} className="text-[#0c1929] text-base flex items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0c1929] mr-4 mt-2 shrink-0"></span>
                    <span className="leading-snug">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-2 font-semibold text-[#0c1929] text-[18px] mb-6">
                <Home className="w-5 h-5 text-[#0c1929]" /> During your stay
              </h3>
              <ul className="space-y-4">
                {thingsToKnow.houseRules.duringYourStay.map((rule, idx) => (
                  <li key={idx} className="text-[#0c1929] text-base flex items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0c1929] mr-4 mt-2 shrink-0"></span>
                    <span className="leading-snug">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {thingsToKnow.houseRules.additionalRules && thingsToKnow.houseRules.additionalRules.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <h3 className="flex items-center gap-2 font-semibold text-[#0c1929] text-[18px] mb-6 mt-4">
                  <FileText className="w-5 h-5 text-[#0c1929]" /> Additional rules
                </h3>
                <ul className="space-y-4">
                  {thingsToKnow.houseRules.additionalRules.map((rule, idx) => (
                    <li key={idx} className="text-[#0c1929] text-base flex items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0c1929] mr-4 mt-2.5 shrink-0"></span>
                      <span className="leading-snug">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {modalType === 'safety' && thingsToKnow.safety && (
          <div className="space-y-10 pl-2">
            <p className="text-[#0c1929] leading-snug text-[15px]">
              Avoid surprises by looking over these important details about your host’s property.
            </p>

            {thingsToKnow.safety.safetyConsiderations && thingsToKnow.safety.safetyConsiderations.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-[#0c1929] text-[18px] mb-6">
                  <AlertTriangle className="w-5 h-5 text-[#0c1929]" /> Safety considerations
                </h3>
                <ul className="space-y-6">
                  {thingsToKnow.safety.safetyConsiderations.map((item, idx) => (
                    <li key={idx}>
                      <h4 className="text-[#0c1929] font-semibold text-base">{item.title}</h4>
                      {item.description && <p className="text-[#0c1929] text-[15px] mt-1">{item.description}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {thingsToKnow.safety.safetyDevices && thingsToKnow.safety.safetyDevices.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <h3 className="flex items-center gap-2 font-semibold text-[#0c1929] text-[18px] mb-6 mt-4">
                  <Shield className="w-5 h-5 text-[#0c1929]" /> Safety devices
                </h3>
                <ul className="space-y-6">
                  {thingsToKnow.safety.safetyDevices.map((item, idx) => (
                    <li key={idx}>
                      <h4 className="text-[#0c1929] font-semibold text-base">{item.title}</h4>
                      {item.description && <p className="text-[#0c1929] text-[15px] mt-1">{item.description}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {modalType === 'cancellation' && dynamicCancellationPolicy.timeline && (
          <div className="space-y-8 pl-2">
            <div className="pl-[26px] border-l-2 border-slate-200/80 space-y-8 relative">
              {dynamicCancellationPolicy.timeline.map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[32px] top-[6px] h-3 w-3 rounded-full bg-[#0c1929] ring-[6px] ring-white" />
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                    <div className="w-24 shrink-0 text-[#0c1929] font-semibold text-sm pt-0.5">
                      <div className="text-[#0c1929] text-xs font-semibold mb-0.5 uppercase tracking-wide">{item.phase}</div>
                      {item.date} <br/>
                      <span className="text-[#0c1929] font-normal">{item.time}</span>
                    </div>
                    <div>
                      <h4 className="text-[17px] font-semibold text-[#0c1929] mb-1">{item.title}</h4>
                      <p className="text-[#0c1929] text-[15px] leading-snug">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-8 border-t border-slate-200 mt-10">
               <p className="text-[#0c1929] leading-snug text-sm">
                 Make sure this host's cancellation policy works for you before booking.
               </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
