"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { t } from "@/lib/i18n/translations";

export default function Hero() {
  const { lang } = useLang();
  const tr = t[lang].hero;

  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden flex items-center justify-center">
      <video
        className="absolute inset-0 w-full h-full object-cover scale-105"
        src="https://assets.mixkit.co/videos/45312/45312-720.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-forest/80 via-forest/50 to-forest/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-forest/40 via-transparent to-forest/20" />
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundSize: "256px 256px",
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center pt-28 sm:pt-0">
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="9th Rotary Indian Summer Classic & Sports Cars Tour 2026"
            width={320}
            height={128}
            className="h-28 sm:h-36 w-auto object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            priority
          />
        </div>

        <h1 className="font-heading text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-[-0.03em] mb-4">
          {tr.title}
          <br />
          <span className="text-sage">{tr.titleAccent}</span>
        </h1>

        <div className="mt-3 mb-8 px-5 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm inline-flex">
          <span className="text-white/80 text-sm font-medium tracking-[0.2em] uppercase">
            {tr.badge}
          </span>
        </div>

        <p className="text-white/75 text-lg sm:text-xl max-w-2xl leading-relaxed mb-10 font-light">
          {tr.p1}
          <br /><br />
          {tr.p2}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="#register"
            className="px-8 py-3.5 rounded-full bg-sage text-forest font-semibold text-sm tracking-wide hover:bg-sage-light active:scale-[0.98] transition-[background-color,transform] duration-200 shadow-[0_8px_32px_rgba(82,183,136,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-forest"
          >
            {tr.cta1}
          </Link>
          <Link
            href="#about"
            className="px-8 py-3.5 rounded-full border border-white/30 text-white font-medium text-sm tracking-wide hover:bg-white/10 hover:border-white/50 active:scale-[0.98] transition-[background-color,border-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            {tr.cta2}
          </Link>
        </div>

        <div className="mt-14 flex items-center gap-8 text-white/50 text-xs tracking-widest uppercase">
          <div className="text-center">
            <div className="text-white text-2xl font-heading font-bold leading-none">6</div>
            <div className="mt-1">Sep 2026</div>
          </div>
          <div className="h-px w-8 bg-white/20" />
          <div className="text-center">
            <div className="text-white text-2xl font-heading font-bold leading-none">10h00</div>
            <div className="mt-1">{tr.start}</div>
          </div>
          <div className="h-px w-8 bg-white/20" />
          <div className="text-center">
            <div className="text-white text-2xl font-heading font-bold leading-none">10h45</div>
            <div className="mt-1">{tr.briefing}</div>
          </div>
        </div>
      </div>

      <a
        href="#about"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/40 hover:text-sage transition-colors duration-300 focus-visible:outline-none"
        aria-label="Scroll to about section"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase font-medium">{tr.scroll}</span>
        <ChevronDown size={18} className="animate-bounce" />
      </a>
    </section>
  );
}
