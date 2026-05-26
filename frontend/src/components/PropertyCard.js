"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { buildBookingQuery, getStayPriceLabel, buildExternalBookingQuery } from "@/lib/booking";


function wrapIndex(index, length) {
  if (index < 0) return length - 1;
  if (index >= length) return 0;
  return index;
}

export default function PropertyCard({ property, booking, highlighted = false, onHoverChange }) {
  const [imageIndex, setImageIndex] = useState(0);
  const touchStartRef = useRef(null);
  const price = getStayPriceLabel(property, booking);
  const bookingUrl = property.bookingUrl || `https://book.homevsuites.com/listings/${property.id}`;
  const queryParams = new URLSearchParams(buildExternalBookingQuery(booking)).toString();
  const href = queryParams ? `${bookingUrl}?${queryParams}` : bookingUrl;

  function goToImage(nextIndex, event) {
    event.preventDefault();
    event.stopPropagation();
    setImageIndex(nextIndex);
  }

  function handleTouchStart(event) {
    touchStartRef.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event) {
    if (touchStartRef.current === null) return;

    const delta = event.changedTouches[0].clientX - touchStartRef.current;
    if (Math.abs(delta) > 36) {
      setImageIndex((current) => wrapIndex(current + (delta < 0 ? 1 : -1), property.images.length));
    }

    touchStartRef.current = null;
  }

  return (
    <article
      onMouseEnter={() => onHoverChange?.(property.id)}
      onMouseLeave={() => onHoverChange?.(null)}
      className={`group min-w-[260px] max-w-[275px] rounded-3xl bg-white transition-all duration-300 cursor-pointer hover:-translate-y-1`}
    >
      <div
        className="relative overflow-hidden rounded-[24px] bg-slate-100"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Link href={href} className="absolute inset-0 z-10">
          <span className="sr-only">Open {property.title}</span>
        </Link>

        <div className="relative aspect-[1.08/1]">
          {property.images.map((image, index) => (
            <div
              key={`${property.id}-${image}`}
              className={`absolute inset-0 transition duration-500 ${index === imageIndex ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <Image
                src={image}
                alt={property.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1400px) 40vw, 24vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1929]/18 via-transparent to-white/10" />

        <div className="absolute left-4 top-4 rounded-full glass-chip px-3 py-2 text-sm font-semibold">
          {price.label}
        </div>

        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full glass-chip px-3 py-2 text-sm font-semibold">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>{property.rating}</span>
          {property.reviewCount && <span className="text-xs font-normal text-[#0c1929]">({property.reviewCount})</span>}
        </div>

        <button
          type="button"
          aria-label="Previous image"
          onClick={(event) => goToImage(wrapIndex(imageIndex - 1, property.images.length), event)}
          className="absolute left-3 bottom-3 z-20 rounded-full glass-chip p-2 text-[#0c1929] hover:bg-white/52"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Next image"
          onClick={(event) => goToImage(wrapIndex(imageIndex + 1, property.images.length), event)}
          className="absolute right-3 bottom-3 z-20 rounded-full glass-chip p-2 text-[#0c1929] hover:bg-white/52"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

      </div>

      <Link href={href} className="mt-4 block px-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[#0c1929] leading-snug">{property.title}</h3>
            <p className="mt-1 text-sm text-[#0c1929]">{property.specs}</p>
          </div>
        </div>
      </Link>

    </article>
  );
}
