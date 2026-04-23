"use client";

import Image from "next/image";
import { useLang } from "@/lib/i18n/LanguageContext";
import { t } from "@/lib/i18n/translations";

const photos = [
  { src: "/gallery-1.jpg", span: "col-span-2 row-span-2", size: "large" },
  { src: "/gallery-2.jpg", span: "col-span-1 row-span-1", size: "small" },
  { src: "/gallery-3.jpg", span: "col-span-1 row-span-1", size: "small" },
  { src: "/gallery-4.jpg", span: "col-span-1 row-span-1", size: "small" },
  { src: "/gallery-5.jpg", span: "col-span-1 row-span-1", size: "small" },
  { src: "/gallery-7.jpg", span: "col-span-2 row-span-1", size: "wide" },
  { src: "/gallery-8.jpg", span: "col-span-1 row-span-1", size: "small" },
  { src: "/gallery-6.jpg", span: "col-span-1 row-span-1", size: "small" },
];

export default function Gallery() {
  const { lang } = useLang();
  const tr = t[lang].gallery;

  return (
    <section id="gallery" className="bg-forest py-24 lg:py-32 grain-overlay">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-10 bg-sage/50" />
            <span className="text-sage text-xs font-semibold tracking-[0.28em] uppercase">{tr.eyebrow}</span>
            <div className="h-px w-10 bg-sage/50" />
          </div>
          <h2 className="font-heading text-white text-4xl sm:text-5xl font-bold tracking-[-0.02em]">{tr.title}</h2>
          <p className="mt-4 text-white/60 text-lg max-w-xl mx-auto leading-relaxed">{tr.subtitle}</p>
        </div>

        <div className="grid grid-cols-4 grid-rows-3 gap-3 h-[640px] lg:h-[740px]">
          {photos.map((photo, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-xl group cursor-pointer ${photo.span}`}
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
            >
              <Image
                src={photo.src}
                alt="Rotary Indian Summer Tour 2026"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes={
                  photo.size === "large" || photo.size === "wide"
                    ? "(max-width: 768px) 100vw, 66vw"
                    : "(max-width: 768px) 50vw, 33vw"
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/50 text-sm tracking-wide">{tr.caption}</p>
        </div>
      </div>
    </section>
  );
}
