"use client";

import { useRef } from "react";
import Map, { NavigationControl, Marker } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Home } from "lucide-react";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function ListingMap({ latitude, longitude }) {
  const mapRef = useRef(null);
  
  if (!latitude || !longitude) return null;

  return (
    <section className="border-t border-slate-200 mt-12 pt-10 pb-6">
      <h2 className="text-[24px] font-bold tracking-tight text-[#0c1929] mb-6">Where you'll be</h2>
      
      <div className="h-[480px] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative">
        <Map
          ref={mapRef}
          initialViewState={{
            latitude,
            longitude,
            zoom: 14,
            pitch: 0,
            bearing: 0
          }}
          mapLib={mapboxgl}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={TOKEN}
          attributionControl={false}
          scrollZoom={false}
        >
          <NavigationControl position="top-right" />
          
          <Marker latitude={latitude} longitude={longitude} anchor="center">
            <div className="relative flex items-center justify-center bg-[#0c1929] text-white w-12 h-12 rounded-full shadow-lg border-4 border-white/40 drop-shadow-md">
              <Home className="w-5 h-5 absolute z-10" />
              <div className="absolute inset-0 bg-[#0c1929] rounded-full animate-ping opacity-30"></div>
            </div>
          </Marker>
        </Map>
      </div>
      
      <div className="mt-6">
        <h3 className="font-semibold text-[#0c1929] text-[17px] mb-2">Toronto, Ontario, Canada</h3>
        <p className="text-[#0c1929] text-[15px] leading-snug">
          Exact location provided after booking. The neighborhood is very accessible and located within prime areas.
        </p>
      </div>
    </section>
  );
}
