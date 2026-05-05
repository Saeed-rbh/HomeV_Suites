"use client";

import dynamic from 'next/dynamic';

const ListingMap = dynamic(() => import('./ListingMap'), { 
  ssr: false, 
  loading: () => (
    <div className="border-t border-slate-200 mt-12 pt-10 pb-6">
      <h2 className="text-[24px] font-bold tracking-tight text-[#0c1929] mb-6">Where you'll be</h2>
      <div className="h-[480px] w-full rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 animate-pulse">
        <p className="text-[#0c1929]">Loading map...</p>
      </div>
    </div>
  )
});

export default function ListingMapWrapper(props) {
  return <ListingMap {...props} />;
}
