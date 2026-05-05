"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";

export default function CalendarWrapper({ blockedDates, checkIn, checkOut, guests }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleDatesChanged = (newCheckIn, newCheckOut) => {
    console.log(`[CalendarWrapper] Received click! newCheckIn=${newCheckIn}, newCheckOut=${newCheckOut}`);
    const query = new URLSearchParams(searchParams.toString());
    
    if (newCheckIn) {
      query.set("checkIn", newCheckIn);
    } else {
      query.delete("checkIn");
    }
    
    // Only set checkOut if it's explicitly known, else delete it if we are still picking or it's null
    if (newCheckOut) {
      query.set("checkOut", newCheckOut);
    } else {
      query.delete("checkOut");
    }

    if (guests) {
      query.set("guests", guests.toString());
    }

    // Using replace instead of push prevents massively polluting the user's back history while picking dates
    router.replace(`${pathname}?${query.toString()}`, { scroll: false });
  };

  return (
    <AvailabilityCalendar 
      blockedDates={blockedDates} 
      checkIn={checkIn} 
      checkOut={checkOut} 
      onCheckInChange={(val) => handleDatesChanged(val, checkOut)}
      onCheckOutChange={(val) => handleDatesChanged(checkIn, val)}
    />
  );
}
