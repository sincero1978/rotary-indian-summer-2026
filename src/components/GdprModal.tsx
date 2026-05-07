"use client";

import { useEffect, useRef } from "react";
import { X, ShieldCheck, Database, Clock, Mail } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { t } from "@/lib/i18n/translations";

interface GdprModalProps {
  onClose: () => void;
}

export default function GdprModal({ onClose }: GdprModalProps) {
  const { lang } = useLang();
  const tr = t[lang].gdpr;
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Trap focus inside modal
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-sage/15 flex items-center justify-center text-sage mt-0.5">
        {icon}
      </div>
      <div>
        <h4 className="text-white font-semibold text-sm mb-1.5">{title}</h4>
        <div className="text-white/60 text-sm leading-relaxed space-y-1">{children}</div>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gdpr-title"
        tabIndex={-1}
        className="relative bg-[#1a2e24] border border-white/15 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col outline-none shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sage/20 flex items-center justify-center text-sage flex-shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-sage text-[10px] font-semibold tracking-[0.2em] uppercase mb-0.5">GDPR</div>
              <h3 id="gdpr-title" className="font-heading text-white text-lg font-bold leading-tight">{tr.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors duration-200 flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto p-6 space-y-6">

          <p className="text-white/65 text-sm leading-relaxed">{tr.intro}</p>

          {/* Data collected */}
          <Section icon={<Database size={15} />} title={tr.collectedTitle}>
            <ul className="space-y-1 list-none">
              {tr.collectedItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-sage mt-1 text-xs">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Purpose */}
          <Section icon={<ShieldCheck size={15} />} title={tr.purposeTitle}>
            <ul className="space-y-1 list-none">
              {tr.purposeItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-sage mt-1 text-xs">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Retention */}
          <Section icon={<Clock size={15} />} title={tr.retentionTitle}>
            <p>{tr.retentionText}</p>
          </Section>

          {/* Rights */}
          <Section icon={<ShieldCheck size={15} />} title={tr.rightsTitle}>
            <p>{tr.rightsText}</p>
          </Section>

          {/* Contact */}
          <Section icon={<Mail size={15} />} title={tr.contactTitle}>
            <p>
              {tr.contactText}{" "}
              <a href="mailto:rist2026@hotmail.com" className="text-sage hover:text-sage-light underline underline-offset-2 transition-colors">
                rist2026@hotmail.com
              </a>
            </p>
          </Section>

          {/* Legal basis */}
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-white/50 text-xs leading-relaxed">{tr.legalBasis}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-sage text-forest font-semibold text-sm hover:bg-sage-light transition-colors duration-200"
          >
            {tr.close}
          </button>
        </div>
      </div>
    </div>
  );
}
