"use client";

import Image from "next/image";
import { useLang } from "@/lib/i18n/LanguageContext";
import { t } from "@/lib/i18n/translations";

// className: responsive col/row spans.
// Mobile (grid-cols-2, auto-rows-[140px]): col-span-2 = full width, col-span-1 = half.
// Desktop (sm: grid-cols-4, grid-rows-3, h-[640px]): existing mosaic layout.
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

export default function Gallery() {
  const { lang } = useLang();
  const tr = t[lang].gallery;

  return (
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

        {/*
          Mobile:  2-column grid, each row 140px tall (auto-rows).
          Desktop: 4-column × 3-row mosaic with fixed height — identical to original.
        */}
        <div className="grid grid-cols-2 auto-rows-[140px] sm:grid-cols-4 sm:grid-rows-3 sm:auto-rows-[unset] gap-2 sm:gap-3 sm:h-[640px] lg:h-[740px]">
          {photos.map((photo, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-lg sm:rounded-xl group cursor-pointer ${photo.className}`}
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
            >
              <Image
                src={photo.src}
                alt="Rotary Indian Summer Tour 2026"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes={photo.sizes}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 text-center">
          <p className="text-white/50 text-sm tracking-wide">{tr.caption}</p>
        </div>
      </div>
    </section>
  );
}
