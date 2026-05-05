"use client";

import { Download } from "lucide-react";

function pad(n) {
  return String(n).padStart(2, "0");
}

function toICSDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

export default function AddToCalendarButton({ listing, booking, resId }) {
  const handleDownload = () => {
    const start = toICSDate(booking.checkIn);
    const end = toICSDate(booking.checkOut);
    const now = new Date();
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}Z`;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//HomEV//EN",
      "BEGIN:VEVENT",
      `UID:${resId}@homev.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:HomEV Stay – ${listing.title}`,
      `DESCRIPTION:Reservation ${resId}. Hosted by ${listing.host}.`,
      `LOCATION:${listing.location}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `homev-${resId}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="w-full inline-flex items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white px-6 py-4 text-base font-semibold text-[#0c1929] transition hover:bg-slate-50 mb-3"
    >
      <Download className="h-4 w-4" />
      Add to calendar (.ics)
    </button>
  );
}
