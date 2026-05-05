"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { MapPin, Settings2, XCircle, ScrollText, Send, X, Calendar, Minus, Plus, Copy, ExternalLink, Check, Clock, ArrowUpRight, ChevronRight, Download } from "lucide-react";
import MapboxComponent from "./MapboxComponent";
import AvailabilityCalendar from "./AvailabilityCalendar";
import { io } from "socket.io-client";

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDateLong(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", timeZone: "UTC" });
}

export default function TripDashboardUI({ listing, reservation }) {
  const [activeModal, setActiveModal] = useState(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [guests, setGuests] = useState(2);
  const [checkIn, setCheckIn] = useState(reservation ? new Date(reservation.startDate).toISOString().split("T")[0] : "");
  const [checkOut, setCheckOut] = useState(reservation ? new Date(reservation.endDate).toISOString().split("T")[0] : "");
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState([]);
  const [hostProfile, setHostProfile] = useState({ displayName: null, avatarUrl: null });
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '') + "/admin/profile/public")
      .then(r => r.json())
      .then(data => { if (data.success && data.data) setHostProfile(data.data); })
      .catch(() => { });
  }, []);

  useEffect(() => {
    let socket = null;
    let isActive = true;
    if (!reservation?.id) return;
    const token = localStorage.getItem("guestToken");

    fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + ''}/messaging/reservation/${reservation.id}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (!isActive) return;
        if (data.success) {
          setMessages(data.data.map(m => ({
            id: m.id, text: m.content,
            sender: m.senderRole === "GUEST" ? "me" : "host",
            createdAt: m.createdAt
          })));

          socket = io(((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')) + "");
          socket.emit("join_thread", data.threadId);
          socket.on("receive_message", (msg) => {
            setMessages(prev => {
              if (prev.some(p => p.id === msg.id)) return prev;
              if (prev.some(p => p.text === msg.content && p.sender !== "host" && !p.id)) return prev;
              return [...prev, { id: msg.id, text: msg.content, sender: msg.senderRole === "GUEST" ? "me" : "host", createdAt: msg.createdAt }];
            });
          });
        }
      })
      .catch(e => console.error(e));

    return () => { isActive = false; if (socket) socket.disconnect(); };
  }, [reservation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !reservation?.id) return;
    const text = newMessage;
    setNewMessage("");
    setMessages(prev => [...prev, { text, sender: "me", createdAt: new Date().toISOString() }]);
    const token = localStorage.getItem("guestToken");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + ''}/messaging/reservation/${reservation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ senderRole: "GUEST", content: text })
      });
    } catch (e) { console.error(e); }
  };

  const hostName = hostProfile.displayName || listing?.host || "Your Host";
  const hostAvatar = hostProfile.avatarUrl ? `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${hostProfile.avatarUrl}` : null;

  const Avatar = ({ size = 40 }) => (
    hostAvatar
      ? <img src={hostAvatar} width={size} height={size} className="rounded-full object-cover ring-2 ring-white shadow" style={{ width: size, height: size }} alt={hostName} />
      : <div className="rounded-full bg-[#0c1929] flex items-center justify-center text-white font-bold ring-2 ring-white shadow" style={{ width: size, height: size, fontSize: size * 0.38 }}>
        {hostName.charAt(0).toUpperCase()}
      </div>
  );

  if (isCancelled) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 text-center px-6">
        <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-semibold text-[#0c1929]">Reservation Cancelled</h1>
        <p className="mt-3 max-w-sm text-[#0c1929]">Your booking at <strong>{listing.title}</strong> has been cancelled.</p>
        <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0c1929] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#0c1929] transition">
          Explore more stays <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    : 0;

  const propertyImage = (() => {
    try { const imgs = listing.images ? JSON.parse(listing.images) : []; return imgs[0] || listing.thumbnailUrl; }
    catch { return listing.thumbnailUrl; }
  })() || "https://images.unsplash.com/photo-1502672260266-1c15874f26db?w=1200&q=80";

  const actions = [
    { id: "modify", icon: Settings2, label: "Modify trip", sub: "Dates & guests" },
    { id: "directions", icon: MapPin, label: "Get directions", sub: "Map & address" },
    { id: "rules", icon: ScrollText, label: "House rules", sub: "What to know" },
    { id: "receipt", icon: Download, label: "Download receipt", sub: "View and print invoice" },
  ];

  // Evaluate Cancellation Deadline
  const activeCancellationPolicy = (nights >= 28 && (listing.cancellationPolicy?.longTerm || listing.longTermPolicy)) 
    ? (listing.cancellationPolicy?.longTerm || listing.longTermPolicy) 
    : (listing.cancellationPolicy?.shortTerm || listing.shortTermPolicy || listing.cancellationPolicy);

  let isDeadlinePassed = false;
  if (reservation.selectedNonRefundable) {
     const gracePeriodHours = activeCancellationPolicy?.bookingGracePeriodHours || 48;
     const bookingDate = new Date(reservation.createdAt || new Date());
     const deadline = new Date(bookingDate.getTime() + gracePeriodHours * 60 * 60 * 1000);
     if (new Date() > deadline) {
        isDeadlinePassed = true;
     }
  } else if (activeCancellationPolicy) {
     const checkInDate = new Date(reservation.startDate);
     checkInDate.setHours(15, 0, 0, 0);
     const deadline = new Date(checkInDate);
     const finalDaysPrior = activeCancellationPolicy.partialRefundPercentage > 0 
         ? activeCancellationPolicy.partialRefundDaysPrior 
         : activeCancellationPolicy.fullRefundDaysPrior;
     deadline.setDate(deadline.getDate() - finalDaysPrior);
     if (new Date() > deadline) {
        isDeadlinePassed = true;
     }
  } else {
     const checkInDate = new Date(reservation.startDate);
     checkInDate.setHours(15, 0, 0, 0);
     const deadline = new Date(checkInDate);
     deadline.setDate(deadline.getDate() - 5);
     if (new Date() > deadline) {
        isDeadlinePassed = true;
     }
  }

  let cancellationText = listing.cancellationDescription || "Contact host for details.";
  let whatHappensNowText = "";
  
  const checkInDateObj = new Date(reservation.startDate);
  checkInDateObj.setHours(15, 0, 0, 0); // Default to 3 PM check-in time
  
  const formatDeadlineDate = (daysPrior) => {
      const d = new Date(checkInDateObj);
      d.setDate(d.getDate() - daysPrior);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (reservation.selectedNonRefundable) {
      cancellationText = "This booking is non-refundable. You will receive a 0% refund.";
      whatHappensNowText = "If you cancel now, you will receive a $0.00 refund.";
  } else if (activeCancellationPolicy) {
      const fullRefundDate = formatDeadlineDate(activeCancellationPolicy.fullRefundDaysPrior);
      const today = new Date();
      const fullDeadline = new Date(checkInDateObj);
      fullDeadline.setDate(fullDeadline.getDate() - activeCancellationPolicy.fullRefundDaysPrior);

      if (activeCancellationPolicy.partialRefundPercentage > 0) {
          const partialRefundDate = formatDeadlineDate(activeCancellationPolicy.partialRefundDaysPrior);
          cancellationText = `Full refund if cancelled before ${fullRefundDate}. ${activeCancellationPolicy.partialRefundPercentage}% refund if cancelled before ${partialRefundDate}.`;
          
          const partialDeadline = new Date(checkInDateObj);
          partialDeadline.setDate(partialDeadline.getDate() - activeCancellationPolicy.partialRefundDaysPrior);
          
          if (today <= fullDeadline) {
              whatHappensNowText = `If you cancel now, you will receive a full refund of $${(reservation.totalPrice || 0).toFixed(2)}.`;
          } else if (today <= partialDeadline) {
              const partialAmount = (reservation.totalPrice || 0) * (activeCancellationPolicy.partialRefundPercentage / 100);
              whatHappensNowText = `If you cancel now, you will receive a ${activeCancellationPolicy.partialRefundPercentage}% refund of $${partialAmount.toFixed(2)}.`;
          } else {
              whatHappensNowText = `The cancellation deadline has passed. If you cancel now, you will receive a $0.00 refund.`;
          }
      } else {
          cancellationText = `Full refund if cancelled before ${fullRefundDate}. No refund after that.`;
          if (today <= fullDeadline) {
              whatHappensNowText = `If you cancel now, you will receive a full refund of $${(reservation.totalPrice || 0).toFixed(2)}.`;
          } else {
              whatHappensNowText = `The cancellation deadline has passed. If you cancel now, you will receive a $0.00 refund.`;
          }
      }
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-12">
        {/* Page Title */}
        <div className="mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0c1929] mb-1.5">My Trips</p>
          <h1 className="text-4xl font-black text-[#0c1929] tracking-tight">Upcoming stay</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* LEFT: Booking info + Chat */}
          <div className="space-y-6">
            {/* Property Image Card */}
            <div className="relative rounded-[28px] overflow-hidden shadow-[0_8px_32px_rgba(12,25,41,0.12)] aspect-[16/7] w-full">
              <img
                src={propertyImage}
                alt={listing.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
              {/* Bottom overlay with listing name */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0c1929]/75 via-[#0c1929]/30 to-transparent px-7 pt-16 pb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white mb-3 shadow-lg">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Confirmed
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{listing.title}</h2>
                <p className="text-xs text-white/50 font-bold flex items-center gap-1.5 mt-1">
                  <MapPin className="h-3 w-3" /> {listing.neighborhood}, {listing.location}
                </p>
              </div>
            </div>

            {/* Stay Details Card */}
            <div className="rounded-[28px] bg-white border border-zinc-100/80 shadow-[0_2px_12px_rgba(12,25,41,0.06)] overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-zinc-100">
                <div className="px-6 py-5 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-[#0c1929] uppercase tracking-[0.18em] mb-2">Check-in</p>
                  <p className="text-sm font-bold text-[#0c1929] leading-snug">{formatDateLong(checkIn)}</p>
                  <p className="text-[11px] text-[#0c1929] font-semibold mt-1.5">After 3:00 PM</p>
                </div>
                <div className="px-6 py-5 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-[#0c1929] uppercase tracking-[0.18em] mb-2">Checkout</p>
                  <p className="text-sm font-bold text-[#0c1929] leading-snug">{formatDateLong(checkOut)}</p>
                  <p className="text-[11px] text-[#0c1929] font-semibold mt-1.5">Before 11:00 AM</p>
                </div>
                <div className="px-6 py-5 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-[#0c1929] uppercase tracking-[0.18em] mb-2">Stay</p>
                  <p className="text-sm font-bold text-[#0c1929]">{nights} night{nights !== 1 ? "s" : ""}</p>
                  <Link href={`/listing/${listing.id}`} className="inline-flex items-center gap-1 text-[11px] text-indigo-500 font-bold mt-1.5 hover:text-indigo-700 transition-colors">
                    View listing <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="rounded-[28px] bg-white border border-zinc-100/80 shadow-[0_2px_12px_rgba(12,25,41,0.06)] flex flex-col" style={{ height: 580 }}>
              {/* Chat Header */}
              <div className="flex items-center gap-4 px-6 py-5 border-b border-zinc-100 bg-zinc-50/60">
                <div className="relative">
                  <Avatar size={46} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white shadow" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[#0c1929] tracking-tight">{hostName}</p>
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Online · Replies within an hour
                  </p>
                </div>
                <div className="h-2 w-2 rounded-full bg-zinc-300" />
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3" style={{ background: 'linear-gradient(180deg, #fafafa 0%, #f8fafc 100%)' }}>
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 select-none">
                    <div className="h-14 w-14 rounded-full border-2 border-dashed border-zinc-200 flex items-center justify-center text-zinc-300">
                      <Send className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-[#0c1929] uppercase tracking-widest">No messages yet</p>
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const isMe = m.sender === "me";
                    const prevSender = i > 0 ? messages[i - 1].sender : null;
                    const showAvatar = !isMe && prevSender !== "host";
                    return (
                      <div key={i} className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        {!isMe && (
                          <div className={`shrink-0 transition-opacity ${showAvatar ? "opacity-100" : "opacity-0"}`}>
                            <Avatar size={28} />
                          </div>
                        )}
                        <div className={`flex flex-col gap-1 max-w-[74%] ${isMe ? "items-end" : "items-start"}`}>
                          <div className={`px-4 py-2.5 rounded-[18px] text-[13.5px] leading-relaxed font-medium shadow-sm
                            ${isMe
                              ? "bg-[#0c1929] text-white rounded-br-sm shadow-[#0c1929]/10"
                              : "bg-white text-[#0c1929] rounded-bl-sm border border-zinc-100 shadow-zinc-200/40"
                            }`}>
                            {m.text}
                          </div>
                          <span className="text-[10px] text-[#0c1929] font-semibold px-1">{formatTime(m.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                {typing && (
                  <div className="flex items-end gap-2.5">
                    <Avatar size={30} />
                    <div className="bg-zinc-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-[#0c1929] animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 rounded-full bg-[#0c1929] animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-[#0c1929] animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="px-5 py-4 border-t border-zinc-100 bg-white">
                <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 border border-zinc-200 focus-within:border-[#0c1929] focus-within:bg-white focus-within:shadow-md focus-within:shadow-zinc-100 transition-all duration-200 px-5 py-1.5">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder={`Message ${hostName}…`}
                    className="flex-1 bg-transparent text-[13.5px] font-semibold text-[#0c1929] placeholder:text-[#0c1929] placeholder:font-medium outline-none py-2.5"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    className="h-8 w-8 rounded-full bg-[#0c1929] flex items-center justify-center text-white shrink-0 transition-all hover:bg-[#0c1929] hover:scale-110 active:scale-95 disabled:opacity-20 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Actions */}
          <div className="space-y-4 lg:sticky lg:top-8 self-start">
            {/* Quick Actions */}
            <div className="rounded-[28px] bg-white border border-zinc-100/80 shadow-[0_2px_12px_rgba(12,25,41,0.06)] overflow-hidden divide-y divide-zinc-50">
              {actions.map(({ id, icon: Icon, label, sub }) => {
                const disabled = id === "modify" && isDeadlinePassed;
                return (
                  <div key={id} className="relative group">
                    <button
                      onClick={() => { 
                         if (disabled) return;
                         if (id === "receipt") {
                            window.open(`/receipt/${reservation.id}`, '_blank');
                         } else {
                            setActiveModal(id); 
                         }
                      }}
                      disabled={disabled}
                      className={`w-full flex items-center gap-4 px-6 py-5 hover:bg-zinc-50 transition-all duration-150 text-left ${disabled ? "opacity-50 cursor-not-allowed" : "active:bg-zinc-100 group"}`}
                    >
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-150 shadow-sm ${disabled ? "bg-zinc-100 text-zinc-400" : "bg-zinc-100 group-hover:bg-[#0c1929] group-hover:text-white"}`}>
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-bold text-[#0c1929]">{label}</p>
                        <p className="text-[11px] text-[#0c1929] font-semibold mt-0.5">{sub}</p>
                      </div>
                      {!disabled && <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-[#0c1929] group-hover:translate-x-0.5 transition-all shrink-0" />}
                    </button>
                    {disabled && (
                      <div className="pointer-events-none absolute left-1/2 -top-10 -translate-x-1/2 rounded-lg bg-[#0c1929] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                        Cancellation deadline has passed
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#0c1929]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Host Card */}
            <div className="rounded-[28px] overflow-hidden border border-zinc-100/80 shadow-[0_2px_12px_rgba(12,25,41,0.06)]" style={{ background: 'linear-gradient(135deg, #0c1929 0%, #1e293b 100%)' }}>
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar size={52} />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-[#0c1929]" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white tracking-tight">{hostName}</p>
                    <p className="text-[11px] text-white/70 font-bold uppercase tracking-widest mt-0.5">Responsible Host</p>
                  </div>
                </div>
                <p className="mt-5 text-[12px] text-white/80 leading-relaxed font-medium border-t border-white/10 pt-4">
                  Available to answer any questions about your stay.
                </p>
              </div>
            </div>

            {/* Cancel */}
            <div className="relative group">
              <button
                onClick={() => { if (!isDeadlinePassed) setActiveModal("cancel"); }}
                disabled={isDeadlinePassed}
                className={`w-full flex items-center justify-center gap-2.5 rounded-[28px] border py-4 text-[13px] font-bold transition-all duration-150 ${isDeadlinePassed ? "border-zinc-200/50 bg-zinc-50 text-zinc-400 opacity-50 cursor-not-allowed" : "border-zinc-200/80 bg-white/80 text-[#0c1929] hover:border-red-200 hover:bg-red-50 hover:text-red-600"}`}
              >
                <XCircle className="h-4 w-4" />
                Cancel reservation
              </button>
              {isDeadlinePassed && (
                <div className="pointer-events-none absolute left-1/2 -top-10 -translate-x-1/2 rounded-lg bg-[#0c1929] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                  Cancellation deadline has passed
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#0c1929]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ——— MODALS ——— */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#0c1929]/50 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && setActiveModal(null)}
        >
          <div className={`w-full bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 ${activeModal === "modify" ? "max-w-4xl" : "max-w-lg"}`}>

            {/* MODIFY */}
            {activeModal === "modify" && <>
              <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100">
                <h3 className="text-xl font-bold text-[#0c1929]">Modify Trip</h3>
                <button onClick={() => setActiveModal(null)} className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-[#0c1929] hover:bg-zinc-200 transition"><X className="h-4.5 w-4.5" /></button>
              </div>
              <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto">
                <div>
                  <p className="text-xs font-black text-[#0c1929] uppercase tracking-[0.18em] mb-4">Select Dates</p>
                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 overflow-hidden">
                    <AvailabilityCalendar 
                        blockedDates={listing.blockedDates || []} 
                        checkIn={checkIn} 
                        checkOut={checkOut} 
                        onCheckInChange={setCheckIn}
                        onCheckOutChange={setCheckOut}
                        showHeader={false}
                        showClearDates={false}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-6 pt-2">
                  <div className="w-full">
                    <p className="text-xs font-black text-[#0c1929] uppercase tracking-[0.18em] mb-4">Guests</p>
                    <div className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-6 py-5">
                      <div>
                        <p className="text-sm font-bold text-[#0c1929]">Adults</p>
                        <p className="text-xs text-[#0c1929] font-semibold">Age 13 or above</p>
                      </div>
                      <div className="flex items-center gap-5">
                        <button onClick={() => setGuests(Math.max(1, guests - 1))} className="h-9 w-9 rounded-full border border-zinc-200 flex items-center justify-center text-[#0c1929] hover:border-[#0c1929] hover:text-[#0c1929] transition bg-white"><Minus className="h-4 w-4" /></button>
                        <span className="text-xl font-black text-[#0c1929] w-5 text-center">{guests}</span>
                        <button onClick={() => setGuests(guests + 1)} className="h-9 w-9 rounded-full border border-zinc-200 flex items-center justify-center text-[#0c1929] hover:border-[#0c1929] hover:text-[#0c1929] transition bg-white"><Plus className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                  <div className="w-full mt-2">
                    <button onClick={() => setActiveModal(null)} className="w-full rounded-2xl bg-[#0c1929] py-5 text-sm font-bold text-white hover:bg-[#152b47] transition shadow-[0_8px_20px_rgba(12,25,41,0.15)] hover:shadow-[0_12px_24px_rgba(12,25,41,0.2)] hover:-translate-y-0.5 active:translate-y-0">
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </>}

            {/* DIRECTIONS */}
            {activeModal === "directions" && (
              <div className="max-h-[90vh] w-full flex flex-col overflow-hidden bg-white">
                <div className="flex items-center justify-between px-8 py-6 shrink-0 relative z-10">
                  <h3 className="text-xl font-bold text-[#0c1929]">Directions</h3>
                  <button onClick={() => setActiveModal(null)} className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-[#0c1929] hover:bg-zinc-200 transition"><X className="h-4.5 w-4.5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto pb-6">
                  <div className="h-[280px] w-full px-6">
                    <MapboxComponent properties={[listing]} booking={{ checkIn, checkOut, guests }} />
                  </div>
                  <div className="px-8 mt-8 space-y-5">
                    <div className="flex items-start justify-between gap-5 rounded-[24px] bg-slate-50/80 border border-slate-100 p-6 shadow-sm">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0c1929] mb-2">Address</p>
                        <p className="text-base font-bold text-[#0c1929] leading-snug">{listing.address || "703, 360 Assiniboine Road"}<br />{listing.city || "North York"}, {listing.province || "ON"}</p>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(listing.address || "703, 360 Assiniboine Road, North York"); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="h-11 w-11 shrink-0 rounded-[16px] border border-slate-200 bg-white flex items-center justify-center text-[#0c1929] shadow-sm hover:bg-[#0c1929] hover:text-white hover:border-[#0c1929] hover:shadow-md transition-all duration-200 active:scale-95">
                        {copied ? <Check className="h-4.5 w-4.5 text-emerald-500" /> : <Copy className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#0c1929] py-4 text-sm font-bold text-white hover:bg-[#152b47] transition shadow-[0_4px_14px_rgba(12,25,41,0.15)] hover:shadow-[0_6px_20px_rgba(12,25,41,0.2)]">
                      <ExternalLink className="h-4 w-4" /> Open in Google Maps
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* RULES */}
            {activeModal === "rules" && <>
              <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100">
                <h3 className="text-xl font-bold text-[#0c1929]">House Rules</h3>
                <button onClick={() => setActiveModal(null)} className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-[#0c1929] hover:bg-zinc-200 transition"><X className="h-4.5 w-4.5" /></button>
              </div>
              <div className="p-8 space-y-5">
                {[
                  "Check-in after 3:00 PM — Checkout before 11:00 AM.",
                  "No parties, events, or excessive noise after 10 PM.",
                  "Smoking is strictly prohibited inside.",
                  `Pets are ${listing.petsAllowed ? "allowed (register during booking)" : "not permitted"}.`
                ].map((rule, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="h-6 w-6 rounded-full bg-[#0c1929] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm font-semibold text-[#0c1929] leading-relaxed">{rule}</p>
                  </div>
                ))}
                <button onClick={() => setActiveModal(null)} className="w-full mt-4 rounded-2xl bg-zinc-100 py-4 text-sm font-bold text-[#0c1929] hover:bg-zinc-200 transition">Got it</button>
              </div>
            </>}

            {/* CANCEL */}
            {activeModal === "cancel" && <>
              <div className="flex items-center justify-between px-8 py-6 border-b border-red-50 bg-red-50/40">
                <h3 className="text-xl font-bold text-red-600">Cancel Reservation</h3>
                <button onClick={() => setActiveModal(null)} className="h-9 w-9 rounded-full bg-white border border-red-100 flex items-center justify-center text-[#0c1929] hover:text-red-600 transition"><X className="h-4.5 w-4.5" /></button>
              </div>
              <div className="p-8 space-y-6">
                <p className="text-sm font-semibold text-[#0c1929] leading-relaxed">Are you sure you want to cancel your upcoming stay at <strong className="text-[#0c1929]">{listing.title}</strong>?</p>
                <div className="rounded-2xl border border-red-100 bg-red-50/30 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-500 mb-2">Cancellation Policy</p>
                  <p className="text-sm font-semibold text-red-900/80 leading-relaxed mb-3">{cancellationText}</p>
                  {whatHappensNowText && (
                      <div className="rounded-xl bg-white/60 px-4 py-3 border border-red-100 shadow-sm">
                          <p className="text-[13px] font-bold text-red-700">{whatHappensNowText}</p>
                      </div>
                  )}
                </div>
                <div className="space-y-3 pt-2">
                  <button onClick={async () => { try { const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + ''}/reservations/${reservation.id}`, { method: "DELETE" }); if (res.ok) { setActiveModal(null); window.location.reload(); } } catch (e) { console.error(e); } }} className="w-full rounded-2xl bg-red-600 py-4 text-sm font-bold text-white hover:bg-red-700 transition">
                    Yes, cancel reservation
                  </button>
                  <button onClick={() => setActiveModal(null)} className="w-full rounded-2xl border border-zinc-200 py-4 text-sm font-bold text-[#0c1929] hover:bg-zinc-50 transition">
                    Keep my reservation
                  </button>
                </div>
              </div>
            </>}

          </div>
        </div>
      )}
    </div>
  );
}
