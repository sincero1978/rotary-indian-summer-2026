"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import type { Rally } from "@/lib/rallies";
import { useLang } from "@/lib/i18n/LanguageContext";

const copy = {
  en: { eyebrow: "Rally archive", title: "The 9th Rotary Indian Summer Rally", description: "Relive the day, explore the route, and browse photographs from past Rotary Indian Summer rallies.", empty: "Photos from this rally will be added soon.", select: "Choose a rally", photo: "photos", prev: "Previous photo", next: "Next photo", close: "Close" },
  fr: { eyebrow: "Archives des rallyes", title: "Le 9e Rotary Indian Summer Rally", description: "Revivez cette journée et découvrez les photos des précédents rallyes Rotary Indian Summer.", empty: "Les photos de ce rallye seront bientôt ajoutées.", select: "Choisir un rallye", photo: "photos", prev: "Photo précédente", next: "Photo suivante", close: "Fermer" },
  lu: { eyebrow: "Rally-Archiv", title: "Den 9. Rotary Indian Summer Rally", description: "Erlieft den Dag nach eng Kéier a kuckt Fotoe vu fréiere Rotary Indian Summer Rallyen.", empty: "Fotoe vun dësem Rally ginn deemnächst dobäigesat.", select: "Rally auswielen", photo: "Fotoen", prev: "Virdrun Foto", next: "Nächst Foto", close: "Zoumaachen" },
} as const;

export default function RallyArchive() {
  const { lang } = useLang();
  const text = copy[lang];
  const [rallies, setRallies] = useState<Rally[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [activeImage, setActiveImage] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/rallies", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<Rally[]> : [])
      .then((items) => { setRallies(items); setSelectedId(items[0]?.id ?? ""); })
      .catch(() => setRallies([]));
  }, []);

  const selected = rallies.find((rally) => rally.id === selectedId);
  const images = selected?.images ?? [];
  const move = useCallback((amount: number) => setActiveImage((index) => index === null ? null : (index + amount + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (activeImage === null) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveImage(null);
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", handleKey); document.body.style.overflow = ""; };
  }, [activeImage, move]);

  return (
    <section id="gallery" className="bg-forest py-16 sm:py-24 lg:py-32 grain-overlay">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-10 sm:mb-14">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-10 bg-sage/50" />
            <span className="text-sage text-xs font-semibold tracking-[0.28em] uppercase">{text.eyebrow}</span>
            <div className="h-px w-10 bg-sage/50" />
          </div>
          <h2 className="font-heading text-white text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.02em]">{selected?.title ?? text.title}</h2>
          <p className="mt-4 text-white/60 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">{text.description}</p>
        </div>

        {rallies.length > 1 && (
          <div className="flex justify-center mb-8">
            <label className="sr-only" htmlFor="rally-archive-select">{text.select}</label>
            <select id="rally-archive-select" value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setActiveImage(0); }} className="max-w-full rounded-full border border-white/20 bg-[#1e3528] px-5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage">
              {rallies.map((rally) => <option key={rally.id} value={rally.id}>{rally.title} · {new Date(`${rally.date}T12:00:00`).getFullYear()}</option>)}
            </select>
          </div>
        )}

        {images.length === 0 ? (
          <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 px-6 py-20 text-center">
            <Images className="mx-auto mb-4 text-sage/70" size={36} />
            <p className="text-white/60">{text.empty}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 auto-rows-[130px] sm:grid-cols-4 sm:auto-rows-[190px] gap-2 sm:gap-3">
              {images.map((image, index) => (
                <button key={image.id} type="button" onClick={() => setActiveImage(index)} className={`relative overflow-hidden rounded-lg sm:rounded-xl group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage ${index === 0 ? "col-span-2 row-span-2" : ""}`} aria-label={`${image.alt} (${index + 1} ${text.photo})`}>
                  <Image src={image.url} alt={image.alt} fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 640px) 50vw, 25vw" />
                  <span className="absolute inset-0 bg-forest/0 group-hover:bg-forest/20 transition-colors" />
                </button>
              ))}
            </div>
            <p className="mt-6 text-center text-white/40 text-sm">{images.length} {text.photo}</p>
            {activeImage !== null && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4" role="dialog" aria-modal="true" aria-label={images[activeImage]?.alt} onClick={() => setActiveImage(null)}>
                <button onClick={() => setActiveImage(null)} aria-label={text.close} className="absolute right-5 top-5 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><X size={20} /></button>
                <button onClick={(event) => { event.stopPropagation(); move(-1); }} aria-label={text.prev} className="absolute left-3 sm:left-8 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><ChevronLeft size={24} /></button>
                <div className="relative h-[82vh] w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
                  <Image src={images[activeImage].url} alt={images[activeImage].alt} fill unoptimized className="object-contain" sizes="90vw" priority />
                </div>
                <button onClick={(event) => { event.stopPropagation(); move(1); }} aria-label={text.next} className="absolute right-3 sm:right-8 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><ChevronRight size={24} /></button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
