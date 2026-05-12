import { Suspense } from "react";
import DiscoveryView from "@/components/DiscoveryView";

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f3f5f8] min-h-[100dvh]">
        <div className="relative flex flex-col items-center">
          <img src="/suites-logo.png" alt="HomEV" className="h-12 w-auto object-contain mix-blend-multiply opacity-80 mb-6" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#0c1929] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#0c1929] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#0c1929] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="mt-6 text-[10px] font-bold text-[#0c1929] tracking-[0.3em] uppercase">Curating Premium Stays...</p>
        </div>
      </div>
    }>
      <DiscoveryView />
    </Suspense>
  );
}
