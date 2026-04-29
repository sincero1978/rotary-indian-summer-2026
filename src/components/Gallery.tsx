"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { t } from "@/lib/i18n/translations";

const photos = [
  {
    src: "/gallery-1.jpg",
    className: "col-span-2 row-span-1 sm:col-span-2 sm:row-span-2",
    sizes: "(max-width: 640px) 100vw, 50vw",
  },
  {
    src: "/gallery-2.jpg",
    className: "col-span-1 row-span-1",
    sizes: "(max-width: 640px) 50vw, 25vw",
  },
  {
    src: "/gallery-3.jpg",
    className: "col-span-1 row-span-1",
    sizes: "(max-width: 640px) 50vw, 25vw",
  },
  {
    src: "/gallery-4.jpg",
    className: "col-span-1 row-span-1",
    sizes: "(max-width: 640px) 50vw, 25vw",
  },
  {
    src: "/gallery-5.jpg",
    className: "col-span-1 row-span-1",
    sizes: "(max-width: 640px) 50vw, 25vw",
  },
  {
    src: "/gallery-7.jpg",
    className: "col-span-2 row-span-1",
    sizes: "(max-width: 640px) 100vw, 50vw",
  },
  {
    src: "/gallery-8.jpg",
    className: "col-span-1 row-span-1",
    sizes: "(max-width: 640px) 50vw, 25vw",
  },
  {
    src: "/gallery-6.jpg",
    className: "col-span-1 row-span-1",
    sizes: "(max-width: 640px) 50vw, 25vw",
  },
];

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ index, onClose }: { index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index);

  const prev = useCallback(() =>
    setCurrent((c) => (c - 1 + photos.length) % photos.length), []);
  const next = useCallback(() =>
    setCurrent((c) => (c + 1) % photos.length), []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowLeft")   prev();
      if (e.key === "ArrowRight")  next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors duration-200"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium tabular-nums">
        {current + 1} / {photos.length}
      </div>

      {/* Prev arrow */}
      <button
        onClick={(e) => { e.stopPropagation(); prev(); }}
        className="absolute left-3 sm:left-6 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors duration-200"
        aria-label="Previous photo"
      >
        <ChevronLeft size={22} />
      </button>

      {/* Image */}
      <div
        className="relative w-full h-full max-w-5xl mx-16 sm:mx-24"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          key={current}
          src={photos[current].src}
          alt={`Rotary Indian Summer Tour 2026 — photo ${current + 1}`}
          fill
          className="object-contain select-none"
          sizes="(max-width: 640px) 100vw, 80vw"
          priority
          draggable={false}
        />
      </div>

      {/* Next arrow */}
      <button
        onClick={(e) => { e.stopPropagation(); next(); }}
        className="absolute right-3 sm:right-6 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors duration-200"
        aria-label="Next photo"
      >
        <ChevronRight size={22} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
              i === current ? "bg-white w-4" : "bg-white/35 hover:bg-white/60"
            }`}
            aria-label={`Go to photo ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Gallery section ──────────────────────────────────────────────────────────

export default function Gallery() {
  const { lang } = useLang();
  const tr = t[lang].gallery;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <section id="gallery" className="bg-forest py-16 sm:py-24 lg:py-32 grain-overlay">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-10 sm:mb-14">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-10 bg-sage/50" />
              <span className="text-sage text-xs font-semibold tracking-[0.28em] uppercase">{tr.eyebrow}</span>
              <div className="h-px w-10 bg-sage/50" />
            </div>
            <h2 className="font-heading text-white text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.02em]">{tr.title}</h2>
            {tr.subtitle && (
              <p className="mt-4 text-white/60 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">{tr.subtitle}</p>
            )}
          </div>

          <div className="grid grid-cols-2 auto-rows-[140px] sm:grid-cols-4 sm:grid-rows-3 sm:auto-rows-[unset] gap-2 sm:gap-3 sm:h-[640px] lg:h-[740px]">
            {photos.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className={`relative overflow-hidden rounded-lg sm:rounded-xl group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage ${photo.className}`}
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
                aria-label={`Open photo ${i + 1} in full screen`}
              >
                <Image
                  src={photo.src}
                  alt="Rotary Indian Summer Tour 2026"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes={photo.sizes}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                {/* Zoom hint */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 sm:mt-12 text-center">
            <p className="text-white/50 text-sm tracking-wide">{tr.caption}</p>
          </div>
        </div>
      </section>

      {lightboxIndex !== null && (
        <Lightbox index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </>
  );
}
