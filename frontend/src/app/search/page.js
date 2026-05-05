import { Suspense } from "react";
import DiscoveryView from "@/components/DiscoveryView";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-[#f3f5f8]" />}>
      <DiscoveryView />
    </Suspense>
  );
}
