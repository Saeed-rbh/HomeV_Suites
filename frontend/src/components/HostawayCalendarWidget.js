"use client";

import { useEffect } from "react";
import Script from "next/script";

export default function HostawayCalendarWidget({ listingId, widgetId }) {
  const handleScriptLoad = () => {
    if (typeof window !== "undefined" && window.hostawayCalendarWidget) {
      window.hostawayCalendarWidget({
        baseUrl: "https://homevsuites.com/",
        listingId: listingId,
        numberOfMonths: 2,
        openInNewTab: false,
        font: "Open Sans",
        rounded: true,
        button: {
          action: "checkout",
          text: "Book now",
        },
        clearButtonText: "Clear dates",
        color: {
          mainColor: "#0c1929",
          frameColor: "#0c1929",
          textColor: "#ffffff",
        },
      });
    }
  };

  return (
    <>
      <div id={widgetId} />
      <Script
        src="https://d2q3n06xhbi0am.cloudfront.net/calendar.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />
    </>
  );
}
