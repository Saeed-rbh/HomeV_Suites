'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Wifi, 
  UtensilsCrossed, 
  BriefcaseBusiness, 
  CarFront, 
  WashingMachine, 
  KeyRound, 
  Wind, 
  Dumbbell, 
  Trees, 
  Tv
} from 'lucide-react';

const defaultIcons = {
  wifi: Wifi,
  kitchen: UtensilsCrossed,
  workspace: BriefcaseBusiness,
  parking: CarFront,
  laundry: WashingMachine,
  selfCheckIn: KeyRound,
  airConditioning: Wind,
  elevator: ShieldCheck,
  gym: Dumbbell,
  balcony: Trees,
  patio: Trees,
  television: Tv
};

export default function ListingAmenities({ 
  amenities, 
  amenityIcons = defaultIcons, 
  amenityLabels = {}, 
  amenityDescriptions = {} 
}) {
  const [showAll, setShowAll] = useState(false);

  if (!amenities || amenities.length === 0) return null;

  // Group amenities by their "group" property
  const grouped = amenities.reduce((groups, amenity) => {
    const group = amenity.group || "Amenities";
    if (!groups[group]) groups[group] = [];
    groups[group].push(amenity);
    return groups;
  }, {});

  const groupEntries = Object.entries(grouped);
  const displayedGroups = showAll ? groupEntries : groupEntries.slice(0, 2);
  const hasMore = groupEntries.length > 2;

  // Optimization: If only 2 categories exist and they have many items, 
  // maybe we should also limit items? 
  // But user said "first 2 category", so we respect that.

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-7 md:p-8">
      <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#0c1929]">What this place offers</p>
      
      {displayedGroups.map(([groupName, groupAmenities]) => (
        <div key={groupName} className="mt-8 first:mt-6">
          <h3 className="text-base font-semibold text-[#0c1929] mb-4">{groupName}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {groupAmenities.map((amenity) => {
              const id = amenity.id;
              const originalName = amenity.name;
              // Map some common string IDs to icons if they don't have one
              const iconKey = id?.toLowerCase().includes('internet') ? 'wifi' : 
                              id?.toLowerCase().includes('parking') ? 'parking' : 
                              id?.toLowerCase().includes('kitchen') ? 'kitchen' : id;
              
              const Icon = amenityIcons[iconKey] || amenityIcons[id] || ShieldCheck;
              
              return (
                <div key={id} className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-[#0c1929]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#0c1929] shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#0c1929]">{amenityLabels[id] || originalName}</p>
                    <p className="text-sm text-[#0c1929]">{amenityDescriptions[id] ?? "Included with your stay"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="mt-8 pt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="rounded-2xl border border-[#0c1929] px-6 py-3.5 text-sm font-semibold text-[#0c1929] hover:bg-slate-50 transition-colors"
          >
            {showAll ? "Show fewer amenities" : `Show all ${amenities.length} amenities`}
          </button>
        </div>
      )}
    </section>
  );
}
