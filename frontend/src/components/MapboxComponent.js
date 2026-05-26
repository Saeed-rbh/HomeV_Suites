"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import Link from "next/link";
import { buildBookingQuery, buildExternalBookingQuery } from "@/lib/booking";
import "mapbox-gl/dist/mapbox-gl.css";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function MapboxComponent({ properties = [], booking, hoveredId, onHoverChange, onVisibleChange }) {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState({
    latitude: 43.6532,
    longitude: -79.3832,
    zoom: 12.5,
    pitch: 45,
    bearing: -17.6
  });

  // Ensure all properties have valid coordinates to prevent Mapbox crash
  const validProperties = useMemo(() => {
    return properties.map(p => ({
      ...p,
      latitude: Number(p.latitude) || 43.6532,
      longitude: Number(p.longitude) || -79.3832,
    }));
  }, [properties]);

  // Calculate visible properties based on current map bounds
  const updateVisibleProperties = useCallback(() => {
    if (!mapRef.current) return;
    
    const bounds = mapRef.current.getBounds();
    const visibleIds = validProperties
      .filter(p => {
        const lng = p.longitude;
        const lat = p.latitude;
        return (
          lng >= bounds.getWest() &&
          lng <= bounds.getEast() &&
          lat >= bounds.getSouth() &&
          lat <= bounds.getNorth()
        );
      })
      .map(p => p.id);
    
    onVisibleChange?.(visibleIds);
  }, [validProperties, onVisibleChange]);

  // Center map on properties initially
  useEffect(() => {
    if (validProperties.length > 0) {
      const lats = validProperties.map(p => p.latitude);
      const lngs = validProperties.map(p => p.longitude);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      
      setViewState(prev => ({
        ...prev,
        latitude: centerLat,
        longitude: centerLng
      }));
    }
  }, [validProperties]);

  return (
    <div className="relative h-full overflow-hidden rounded-[34px] border border-white/75 bg-slate-100 shadow-inner">
      <Map
        {...viewState}
        ref={mapRef}
        onMove={evt => setViewState(evt.viewState)}
        onIdle={updateVisibleProperties}
        mapLib={mapboxgl}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={TOKEN}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        {validProperties.map((property) => {
          const isHovered = hoveredId === property.id;
          const markerBookingUrl = property.bookingUrl || `https://book.homevsuites.com/listings/${property.id}`;
          const markerQueryParams = new URLSearchParams(buildExternalBookingQuery(booking)).toString();
          const markerHref = markerQueryParams ? `${markerBookingUrl}?${markerQueryParams}` : markerBookingUrl;
          
          return (
            <Marker
              key={property.id}
              latitude={property.latitude}
              longitude={property.longitude}
              anchor="bottom"
            >
              <Link
                href={markerHref}
                onMouseEnter={() => onHoverChange?.(property.id)}
                onMouseLeave={() => onHoverChange?.(null)}
                className={`relative flex items-center justify-center transition-all duration-300 ${
                  isHovered ? "z-50 scale-110" : "z-10"
                }`}
              >
                {/* Custom Glass Marker */}
                <div className={`
                  group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold transition-all
                  ${isHovered 
                    ? "border-white bg-white shadow-xl text-[#0c1929] scale-105" 
                    : "border-[#0c1929] bg-[#0c1929] text-white shadow-md hover:bg-[#152b47] hover:border-[#152b47]"
                  }
                `}>
                  <span className="text-[10px] opacity-70">$</span>
                  {property.pricePerNight || property.price || 0}
                </div>
                
                {/* Pointer tip */}
                <div className={`
                  mx-auto -mt-0.5 h-2 w-2 rotate-45 border-b border-r transition-colors
                  ${isHovered ? "border-[#0c1929]/40 bg-white" : "border-white/80 bg-white/75 backdrop-blur-md"}
                `} />
              </Link>
            </Marker>
          );
        })}
      </Map>

      <div className="pointer-events-none absolute bottom-5 left-5 z-20">
        <div className="rounded-full border border-white/80 bg-white/65 px-4 py-2 text-sm font-medium text-[#0c1929] backdrop-blur-md shadow-sm">
          {properties.length} curated stays in view
        </div>
      </div>
    </div>
  );
}
