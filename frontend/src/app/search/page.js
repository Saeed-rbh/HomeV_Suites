import { Suspense } from "react";
import DiscoveryView from "@/components/DiscoveryView";

export const metadata = {
  title: "Search Properties",
  description:
    "Browse all available premium vacation rentals in Toronto. Filter by dates, guests, and location to find your perfect HomEV stay.",
  alternates: { canonical: "https://homev.ca/search" },
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-[#f3f5f8]" />}>
      <DiscoveryView />
    </Suspense>
  );
}
