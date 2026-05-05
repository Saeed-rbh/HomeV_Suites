"use client";

import Image from "next/image";
import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft } from "lucide-react";

export default function PhotoTourOverlay({ tourData, onClose }) {
  const [activeSection, setActiveSection] = useState(tourData[0]?.space);
  const sectionRefs = useRef({});
  const headerRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            // const activeHeaderBtn = document.getElementById(`nav-btn-${entry.target.id}`);
            // if (activeHeaderBtn && headerRef.current) {
            //   activeHeaderBtn.scrollIntoView({
            //     behavior: "smooth",
            //     inline: "center",
            //     block: "nearest",
            //   });
            // }
          }
        });
      },
      // Trigger when element hits the top 15% of the viewport
      { root: scrollContainerRef.current, rootMargin: "-10% 0px -85% 0px" } 
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [tourData]);

  const scrollTo = (spaceId) => {
    setActiveSection(spaceId);
    sectionRefs.current[spaceId]?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f3f5f8]">
      {/* Header — matches main NavBar style */}
      <div className="sticky top-0 z-20 w-full px-3 pt-3 md:px-6">
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-4 rounded-[30px] glass-panel px-5 py-4 md:px-6">
          {/* Back / close button */}
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#0c1929] hover:text-[#0c1929] shrink-0 transition"
            aria-label="Close tour"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {/* Divider + Logo */}
          <div className="hidden h-8 w-px bg-slate-200 md:block shrink-0" />
          <div className="hidden items-center gap-2 text-[#0c1929] md:flex shrink-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0c1929] to-[#24456e] text-lg font-black text-white shadow-md shadow-[#0c1929]/30">
              H
            </span>
            <p className="text-base font-medium tracking-[0.18em] text-[#0c1929] uppercase">HomEV</p>
          </div>

          {/* Divider */}
          <div className="hidden h-8 w-px bg-slate-200 md:block shrink-0" />

          {/* Room navigation pills */}
          <div
            ref={headerRef}
            className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-hide"
          >
          {tourData.map((section) => (
            <button
              key={section.space}
              id={`nav-btn-${section.space}`}
              onClick={() => scrollTo(section.space)}
              className={`group flex shrink-0 cursor-pointer items-center gap-2.5 rounded-[18px] border p-1.5 pr-4 transition-all duration-200 ${
                activeSection === section.space
                  ? "border-slate-200 bg-white shadow-sm"
                  : "border-transparent bg-transparent hover:bg-white/60 hover:border-slate-200"
              }`}
            >
              <div className="relative h-10 w-14 overflow-hidden rounded-[10px] bg-slate-100">
                <Image
                  src={section.images[0]}
                  alt={section.space}
                  fill
                  sizes="56px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <span
                className={`text-[13px] font-semibold tracking-tight whitespace-nowrap ${
                  activeSection === section.space ? "text-[#0c1929]" : "text-[#0c1929] group-hover:text-[#0c1929]"
                }`}
              >
                {section.space}
              </span>
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* Main Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-8 md:px-6">
        <div className="mx-auto max-w-[1400px] space-y-16 lg:space-y-24">
          {tourData.map((section) => (
            <section
              key={section.space}
              id={section.space}
              ref={(el) => (sectionRefs.current[section.space] = el)}
              className="scroll-mt-24"
            >
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-[#0c1929] md:text-3xl">
                {section.space}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.images.map((img, i) => (
                  <div
                    key={`${section.space}-${i}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-slate-100"
                  >
                    <Image
                      src={img}
                      alt={`${section.space} - View ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
