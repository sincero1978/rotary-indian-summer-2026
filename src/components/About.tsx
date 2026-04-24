"use client";

import Image from "next/image";
import { useLang } from "@/lib/i18n/LanguageContext";
import { t } from "@/lib/i18n/translations";

export default function About() {
  const { lang } = useLang();
  const tr = t[lang].about;

  return (
    <section id="about" className="bg-off-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px w-10 bg-sage" />
          <span className="text-sage text-xs font-semibold tracking-[0.28em] uppercase">
            {tr.eyebrow}
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <h2 className="font-heading text-forest text-4xl sm:text-5xl font-bold leading-tight tracking-[-0.02em] mb-6">
              {tr.title1}
              <br />
              <em className="not-italic text-sage">{tr.title2}</em>
            </h2>

            <p className="text-warm-gray text-base leading-[1.8] mb-4">{tr.p1}</p>
            <p className="text-warm-gray text-base leading-[1.8] mb-4">{tr.p2}</p>
            <p className="text-warm-gray text-base leading-[1.8] mb-4">{tr.p3}</p>
            <p className="text-warm-gray text-base leading-[1.8] mb-4">{tr.p4}</p>
            <p className="text-warm-gray text-base leading-[1.8] mb-6 font-medium text-forest/80">{tr.p5}</p>

            <div className="bg-pale-sage rounded-xl px-5 py-4 mb-8 border border-border flex flex-col gap-1">
              <div className="flex items-center gap-2 text-forest font-semibold text-sm">
                <span className="text-sage">📅</span> {tr.date}
              </div>
              <div className="flex items-center gap-2 text-warm-gray text-sm">
                <span className="text-sage">📍</span>
                {tr.location.split("Mess-Café").map((part, i, arr) =>
                  i < arr.length - 1 ? (
                    <span key={i}>
                      {part}
                      <a
                        href="https://www.google.com/maps/place/Restaurant-Brasserie+Mess+Caf%C3%A9+S%C3%A0rl/@49.558568,6.0059062,832m/data=!3m2!1e3!4b1!4m6!3m5!1s0x47954af4570a8e0f:0xdba89dada1cecad8!8m2!3d49.5585645!4d6.0084811!16s%2Fg%2F1tnsqw5x?entry=ttu&g_ep=EgoyMDI2MDQyMS4wIKXMDSoASAFQAw%3D%3D"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-forest font-semibold underline underline-offset-2 hover:text-sage transition-colors duration-200"
                      >
                        Mess-Café
                      </a>
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </div>
              {tr.routebook && (
                <div className="flex items-center gap-2 text-warm-gray text-sm">
                  <span className="text-sage">🗺</span> {tr.routebook}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              {[
                { value: "1", label: tr.stat1Label, sub: tr.stat1Sub },
                { value: "130", label: tr.stat2Label, sub: tr.stat2Sub },
                { value: "60+", label: tr.stat3Label, sub: tr.stat3Sub },
              ].map(({ value, label, sub }) => (
                <div key={label}>
                  <div className="font-heading text-forest text-3xl font-bold leading-none">
                    {value}
                    <span className="text-sage text-xl ml-0.5">{label}</span>
                  </div>
                  <div className="text-warm-gray text-sm mt-1">{sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[300px] sm:h-[480px] lg:h-[560px]">
            <div className="absolute top-0 right-0 w-[82%] h-[88%] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(45,106,79,0.15)]">
              <Image
                src="/luxembourg-indian-summer.webp"
                alt="Luxembourg in autumn"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 90vw, 45vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/50 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 w-[55%] h-[52%] rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(45,106,79,0.22)] border-4 border-off-white">
              <Image
                src="/old-timer-rally.jpg"
                alt="Classic car at the rally"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="absolute top-4 left-4 bg-forest text-white rounded-xl px-4 py-3 shadow-[0_8px_24px_rgba(45,106,79,0.35)]">
              <div className="font-heading text-3xl font-bold leading-none text-sage">9th</div>
              <div className="text-white/60 text-[10px] tracking-[0.18em] uppercase mt-0.5">{tr.edition}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
