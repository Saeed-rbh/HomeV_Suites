"use client";

import Image from "next/image";
import { useState } from "react";
import PhotoTourOverlay from "./PhotoTourOverlay";

export default function ListingGallery({ listing }) {
  const [showTour, setShowTour] = useState(false);

  return (
    <>
      {/* Mobile Swipeable Gallery */}
      <div className="block lg:hidden flex overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full h-[35vh] sm:h-[45vh] relative">
        {listing.images.map((image, index) => (
          <div key={`mobile-gallery-${index}`} className="relative w-full h-full shrink-0 snap-start" onClick={() => setShowTour(true)}>
            <Image
              src={image}
              alt={`${listing.title} ${index + 1}`}
              fill
              sizes="100vw"
              priority={index === 0}
              className="object-cover"
            />
          </div>
        ))}
        {/* Pagination indicator pill */}
        <div className="absolute bottom-[34px] right-4 z-0 bg-[#222222]/70 backdrop-blur-md px-3 py-1 rounded-[8px] text-white text-[12px] font-semibold tracking-wider">
          1 / {listing.images.length}
        </div>
      </div>

      {/* Desktop Grid Gallery */}
      <div className="mt-8 hidden lg:grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
        <div 
          onClick={() => setShowTour(true)}
          className="group relative min-h-[440px] cursor-pointer overflow-hidden rounded-[20px] bg-slate-100"
        >
          <Image 
            src={listing.images[0]} 
            alt={listing.title} 
            fill 
            sizes="(max-width: 1024px) 100vw, 60vw" 
            className="object-cover transition duration-300 group-hover:brightness-[0.85]" 
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {listing.images.slice(1, 5).map((image, index) => (
            <div 
              key={`${listing.id}-gallery-${index}`} 
              onClick={() => setShowTour(true)}
              className="group relative min-h-[214px] cursor-pointer overflow-hidden rounded-[20px] bg-slate-100"
            >
              <Image
                src={image}
                alt={`${listing.title} gallery ${index + 1}`}
                fill
                sizes="(max-width: 1024px) 50vw, 20vw"
                className="object-cover transition duration-300 group-hover:brightness-[0.85]"
              />
            </div>
          ))}
        </div>
      </div>

      {showTour && (listing.photoTour || listing.images?.length > 0) && (
        <PhotoTourOverlay 
          tourData={listing.photoTour || [{ space: "Property Gallery", images: listing.images }]} 
          onClose={() => setShowTour(false)} 
        />
      )}
    </>
  );
}
