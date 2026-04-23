"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/lib/i18n/LanguageContext";
import { t } from "@/lib/i18n/translations";

export default function Footer() {
  const { lang } = useLang();
  const tr = t[lang].footer;
  const navTr = t[lang].nav;

  const navLinks = [
    { label: navTr.about, href: "#about" },
    { label: navTr.gallery, href: "#gallery" },
    { label: navTr.register, href: "#register" },
    { label: navTr.contact, href: "#contact" },
  ];

  return (
    <footer id="contact" className="bg-[#1a2e24] text-white">
      <div className="border-b border-white/8 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-5">
              <div className="text-[10px] font-medium tracking-[0.22em] uppercase text-sage/70 mb-0.5">
                Rotary Club Bascharage-Kordall
              </div>
              <div className="font-heading text-white text-2xl font-bold tracking-tight leading-tight">
                Indian Summer Rally
              </div>
              <div className="text-[10px] tracking-[0.18em] text-white/40 uppercase mt-0.5">
                2026 Edition
              </div>
            </div>
            <p className="text-white/55 text-sm leading-[1.8] max-w-xs">{tr.tagline}</p>
            <div className="mt-6 flex items-center gap-3">
              <Image
                src="/rotary-international-logo.png"
                alt="Rotary International"
                width={32}
                height={32}
                className="opacity-60"
              />
              <span className="text-white/40 text-xs tracking-wide">{tr.motto}</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white/80 text-xs font-semibold tracking-[0.22em] uppercase mb-5">{tr.nav}</h4>
            <ul className="space-y-3">
              {navLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href}
                    className="text-white/50 text-sm hover:text-sage transition-colors duration-200 focus-visible:outline-none focus-visible:text-sage">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white/80 text-xs font-semibold tracking-[0.22em] uppercase mb-5">{tr.contact}</h4>
            <ul className="space-y-3 text-white/50 text-sm">
              <li>
                <a href="mailto:rist2026@hotmail.com"
                  className="hover:text-sage transition-colors duration-200 focus-visible:outline-none focus-visible:text-sage">
                  rist2026@hotmail.com
                </a>
              </li>
              <li className="leading-relaxed">
                Rotary Club Bascharage-Kordall<br />
                Restaurant Threeland<br />
                50 Rue Pierre Hamer<br />
                4737 Pétange
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-xs">{tr.rights}</p>
          <div className="flex gap-6">
            <Link href="#" className="text-white/30 text-xs hover:text-sage/70 transition-colors focus-visible:outline-none">{tr.privacy}</Link>
            <Link href="#" className="text-white/30 text-xs hover:text-sage/70 transition-colors focus-visible:outline-none">{tr.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
