"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import {
  Plus,
  Minus,
  AlertCircle,
  Building2,
  CheckCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { t } from "@/lib/i18n/translations";
import GdprModal from "@/components/GdprModal";

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_PRICE = 125;
const EXTRA_PRICE = 20;
const MEAL_PRICE = 35;

const BANK_IBAN = "LU80 0019 4955 0049 5000";
const BANK_BIC = "BCEELULL";
const BANK_NAME = "BCEE Spuerkeess";
const ACCOUNT_NAME = "Rotary Club Bascharage-Kordall";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MealChoice {
  include: boolean;
  menu: string;
}

interface FormData {
  driverName: string;
  copilotName: string;
  email: string;
  phone: string;
  carMake: string;
  carModel: string;
  carYear: string;
}

type Step = "form" | "bank";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InputField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-white/70 text-sm font-medium mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-red-400 text-xs flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

function inputClass(error?: string) {
  return (
    "w-full bg-white/8 border rounded-lg px-4 py-2.5 text-white placeholder-white/30 " +
    "focus:outline-none focus:ring-2 transition-[border-color,box-shadow] duration-200 " +
    (error
      ? "border-red-400/60 focus:ring-red-400/30 focus:border-red-400/60"
      : "border-white/20 focus:ring-sage/40 focus:border-sage/60")
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterCTA() {
  const { lang } = useLang();
  const tr = t[lang].register;
  const topRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormData>({
    driverName: "",
    copilotName: "",
    email: "",
    phone: "",
    carMake: "",
    carModel: "",
    carYear: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [extraParticipants, setExtraParticipants] = useState(0);
  const [extraNames, setExtraNames] = useState<string[]>([]);
  const [mealChoices, setMealChoices] = useState<MealChoice[]>([
    { include: false, menu: "1" },
    { include: false, menu: "1" },
  ]);

  const [step, setStep] = useState<Step>("form");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showGdpr, setShowGdpr] = useState(false);

  // ── Derived values ──────────────────────────────────────────────────────────

  const totalPeople = 2 + extraParticipants;
  const syncedMeals: MealChoice[] = Array.from({ length: totalPeople }, (_, i) =>
    mealChoices[i] ?? { include: false, menu: "1" }
  );
  const extraCost = extraParticipants * EXTRA_PRICE;
  const mealCost = syncedMeals.filter((m) => m.include).length * MEAL_PRICE;
  const total = BASE_PRICE + extraCost + mealCost;

  // ── Field helpers ───────────────────────────────────────────────────────────

  const setField = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const clearError = (key: string) =>
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });

  const addExtra = () => {
    if (extraParticipants >= 2) return;
    setExtraParticipants((n) => n + 1);
    setExtraNames((p) => [...p, ""]);
    setMealChoices((p) => [...p, { include: false, menu: "1" }]);
  };

  const removeExtra = () => {
    if (extraParticipants === 0) return;
    setExtraParticipants((n) => n - 1);
    setExtraNames((p) => p.slice(0, -1));
    setMealChoices((p) => p.slice(0, -1));
  };

  const setExtraName = (i: number, value: string) => {
    setExtraNames((p) => p.map((n, idx) => (idx === i ? value : n)));
    clearError(`extra_${i}`);
  };

  const toggleMeal = (i: number) =>
    setMealChoices((p) =>
      p.map((m, idx) => (idx === i ? { ...m, include: !m.include } : m))
    );

  const setMenu = (i: number, menu: string) =>
    setMealChoices((p) =>
      p.map((m, idx) => (idx === i ? { ...m, menu } : m))
    );

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.driverName.trim()) e.driverName = tr.valDriver;
    if (!form.copilotName.trim()) e.copilotName = tr.valCopilot;
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = tr.valEmail;
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 6)
      e.phone = tr.valPhone;
    if (!form.carMake.trim()) e.carMake = tr.valMake;
    if (!form.carModel.trim()) e.carModel = tr.valModel;
    const year = Number(form.carYear);
    if (!form.carYear.trim() || !/^\d{4}$/.test(form.carYear) || year < 1900 || year > 2026)
      e.carYear = tr.valYear;
    extraNames.forEach((name, i) => {
      if (!name.trim()) e[`extra_${i}`] = tr.valExtraName;
    });
    setErrors(e);
    if (Object.keys(e).length > 0) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return false;
    }
    return true;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          extraParticipants,
          extraNames,
          mealChoices: syncedMeals,
          mealCost,
          total,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      setReference(data.reference);
      setStep("bank");
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const participantLabel = (i: number) => {
    if (i === 0) return `${form.driverName || tr.driver} (${tr.person} 1)`;
    if (i === 1) return `${form.copilotName || tr.copilot} (${tr.person} 2)`;
    return `${extraNames[i - 2] || `${tr.extra} ${i - 1}`} (${tr.person} ${i + 1})`;
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
    {showGdpr && <GdprModal onClose={() => setShowGdpr(false)} />}
    <section id="register" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/moselle-tour.avif" alt="Moselle Valley" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-br from-forest/95 via-forest/88 to-forest-dark/95" />
      </div>
      <div
        className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundSize: "256px 256px",
        }}
      />

      <div ref={topRef} className="relative z-10 max-w-4xl mx-auto px-6 lg:px-10">

        {/* Section header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-10 bg-sage/50" />
            <span className="text-sage text-xs font-semibold tracking-[0.28em] uppercase">{tr.eyebrow}</span>
            <div className="h-px w-10 bg-sage/50" />
          </div>
          <h2 className="font-heading text-white text-4xl sm:text-5xl font-bold tracking-[-0.02em]">{tr.title}</h2>
          <p className="mt-4 text-white/65 text-lg max-w-xl mx-auto leading-relaxed">{tr.subtitle}</p>
        </div>

        {/* ── STEP: FORM ── */}
        {step === "form" && (
          <div className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl overflow-hidden">
            <div className="p-8 border-b border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sage text-xs font-semibold tracking-[0.22em] uppercase mb-1">{tr.teamEntryLabel}</div>
                  <h3 className="font-heading text-white text-2xl font-bold">{tr.teamEntryTitle}</h3>
                  <ul className="mt-3 space-y-1.5">
                    {tr.includes.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-white/65 text-sm">
                        <span className="w-4 h-4 rounded-full bg-sage/20 text-sage flex items-center justify-center text-[10px] font-bold flex-shrink-0">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-heading text-white text-4xl font-bold">€{BASE_PRICE}</div>
                  <div className="text-white/40 text-xs mt-1">{tr.perTeam}</div>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {(Object.keys(errors).length > 0 || submitError) && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3">
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-red-300 text-sm">
                    {submitError || tr.errorGeneric}
                  </div>
                </div>
              )}

              {/* Team info */}
              <div>
                <h4 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sage/20 text-sage text-xs font-bold flex items-center justify-center">1</span>
                  {tr.step1}
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <InputField label={tr.driverName} required error={errors.driverName}>
                    <input type="text" placeholder={tr.namePlaceholder} value={form.driverName}
                      onChange={(e) => setField("driverName", e.target.value)} className={inputClass(errors.driverName)} />
                  </InputField>
                  <InputField label={tr.copilotName} required error={errors.copilotName}>
                    <input type="text" placeholder={tr.namePlaceholder} value={form.copilotName}
                      onChange={(e) => setField("copilotName", e.target.value)} className={inputClass(errors.copilotName)} />
                  </InputField>
                  <InputField label={tr.email} required error={errors.email}>
                    <input type="email" placeholder={tr.emailPlaceholder} value={form.email}
                      onChange={(e) => setField("email", e.target.value)} className={inputClass(errors.email)} />
                  </InputField>
                  <InputField label={tr.phone} required error={errors.phone}>
                    <input type="tel" placeholder={tr.phonePlaceholder} value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)} className={inputClass(errors.phone)} />
                  </InputField>
                </div>
              </div>

              {/* Vehicle info */}
              <div>
                <h4 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sage/20 text-sage text-xs font-bold flex items-center justify-center">2</span>
                  {tr.step2}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <InputField label={tr.make} required error={errors.carMake}>
                    <input type="text" placeholder={tr.makePlaceholder} value={form.carMake}
                      onChange={(e) => setField("carMake", e.target.value)} className={inputClass(errors.carMake)} />
                  </InputField>
                  <InputField label={tr.model} required error={errors.carModel}>
                    <input type="text" placeholder={tr.modelPlaceholder} value={form.carModel}
                      onChange={(e) => setField("carModel", e.target.value)} className={inputClass(errors.carModel)} />
                  </InputField>
                  <InputField label={tr.year} required error={errors.carYear}>
                    <input type="text" placeholder={tr.yearPlaceholder} maxLength={4} value={form.carYear}
                      onChange={(e) => setField("carYear", e.target.value.replace(/\D/g, ""))} className={inputClass(errors.carYear)} />
                  </InputField>
                </div>
              </div>

              {/* Extra participants */}
              <div>
                <h4 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sage/20 text-sage text-xs font-bold flex items-center justify-center">3</span>
                  {tr.step3}
                  <span className="text-white/40 text-xs font-normal ml-1">— €{EXTRA_PRICE}{tr.step3Sub}</span>
                </h4>
                <div className="flex items-center gap-5 mb-4">
                  <button onClick={removeExtra} disabled={extraParticipants === 0} aria-label="Remove participant"
                    className="w-9 h-9 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-[background-color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage">
                    <Minus size={16} />
                  </button>
                  <span className="font-heading text-white text-2xl font-bold w-6 text-center">{extraParticipants}</span>
                  <button onClick={addExtra} disabled={extraParticipants >= 2} aria-label="Add participant"
                    className="w-9 h-9 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-[background-color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage">
                    <Plus size={16} />
                  </button>
                  {extraParticipants > 0 && <span className="text-white/50 text-sm">+€{extraCost}</span>}
                </div>
                {extraNames.map((name, i) => (
                  <div key={i} className="mb-3">
                    <InputField label={`${tr.extraLabel} ${i + 1} — ${tr.extraName}`} required error={errors[`extra_${i}`]}>
                      <input type="text" placeholder={tr.namePlaceholder} value={name}
                        onChange={(e) => setExtraName(i, e.target.value)} className={inputClass(errors[`extra_${i}`])} />
                    </InputField>
                  </div>
                ))}
              </div>

              {/* Meal options */}
              <div>
                <h4 className="text-white font-semibold text-base mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sage/20 text-sage text-xs font-bold flex items-center justify-center">4</span>
                  {tr.step4}
                  <span className="text-white/40 text-xs font-normal ml-1">— €{MEAL_PRICE}{tr.step4Sub}</span>
                </h4>
                <p className="text-white/45 text-sm mb-4 ml-8">{tr.mealDesc}</p>
                <div className="space-y-3">
                  {syncedMeals.map((meal, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white/75 text-sm font-medium">{participantLabel(i)}</span>
                        <button onClick={() => toggleMeal(i)} aria-label={`Toggle meal`}
                          className={`relative w-11 h-6 rounded-full transition-[background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage ${meal.include ? "bg-sage" : "bg-white/20"}`}>
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${meal.include ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>
                      {meal.include && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {tr.menus.map((menuLabel, mi) => (
                            <button key={mi} onClick={() => setMenu(i, String(mi + 1))}
                              className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-[background-color,border-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage ${
                                meal.menu === String(mi + 1)
                                  ? "bg-sage/20 border-sage text-white"
                                  : "bg-white/5 border-white/15 text-white/60 hover:border-white/30 hover:text-white/80"
                              }`}>
                              <div className="font-semibold text-xs tracking-wide">{menuLabel}</div>
                              <div className="text-[11px] mt-0.5 opacity-80">{tr.dishes[mi]}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Price summary */}
              <div className="bg-white/5 rounded-xl border border-white/10 px-6 py-5">
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-white/60 text-sm">
                    <span>{tr.teamEntry}</span><span>€{BASE_PRICE}</span>
                  </div>
                  {extraParticipants > 0 && (
                    <div className="flex justify-between text-white/60 text-sm">
                      <span>{tr.extraLine} ({extraParticipants} × €{EXTRA_PRICE})</span>
                      <span>€{extraCost}</span>
                    </div>
                  )}
                  {mealCost > 0 && (
                    <div className="flex justify-between text-white/60 text-sm">
                      <span>{tr.mealsLine} ({syncedMeals.filter((m) => m.include).length} × €{MEAL_PRICE})</span>
                      <span>€{mealCost}</span>
                    </div>
                  )}
                  <div className="border-t border-white/15 pt-3 flex justify-between items-baseline">
                    <span className="text-white font-semibold">{tr.total}</span>
                    <span className="font-heading text-white text-3xl font-bold">€{total}</span>
                  </div>
                </div>
                {/* GDPR notice */}
                <div className="flex items-start gap-2.5 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <ShieldCheck size={15} className="text-sage flex-shrink-0 mt-0.5" />
                  <p className="text-white/50 text-xs leading-relaxed">
                    {t[lang].gdpr.notice}{" "}
                    <button
                      type="button"
                      onClick={() => setShowGdpr(true)}
                      className="text-sage underline underline-offset-2 hover:text-sage-light transition-colors focus-visible:outline-none focus-visible:text-sage-light"
                    >
                      {t[lang].gdpr.noticeLink}
                    </button>
                    .
                  </p>
                </div>

                <button onClick={handleSubmit} disabled={loading}
                  className="w-full py-3.5 rounded-full bg-sage text-forest font-semibold text-sm text-center hover:bg-sage-light active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-[background-color,transform,opacity] duration-200 shadow-[0_8px_32px_rgba(82,183,136,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage flex items-center justify-center gap-2">
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> {tr.processing}</>
                  ) : (
                    `${tr.submitBtn} — €${total}`
                  )}
                </button>
                <p className="text-white/30 text-xs text-center mt-3">{tr.confirmNote}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: BANK TRANSFER ── */}
        {step === "bank" && (
          <div className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={22} className="text-sage" />
              </div>
              <div>
                <div className="text-white font-semibold">{tr.registrationReceived}</div>
                <div className="text-white/50 text-sm">
                  {tr.reference}: <span className="text-sage font-mono font-semibold">{reference}</span>
                  {" "}· {tr.total}: <span className="text-white font-semibold">€{total}</span>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-sage/15 flex items-center justify-center flex-shrink-0">
                  <Building2 size={22} className="text-sage" />
                </div>
                <div>
                  <h3 className="font-heading text-white text-2xl font-bold leading-tight">{tr.bankTitle}</h3>
                  <p className="text-white/50 text-sm">{tr.bankSubtitle}</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/10 mb-6">
                {[
                  { label: tr.accountName, value: ACCOUNT_NAME },
                  { label: tr.bank, value: BANK_NAME },
                  { label: "IBAN", value: BANK_IBAN },
                  { label: "BIC / SWIFT", value: BANK_BIC },
                  { label: tr.amount, value: `€${total}` },
                  { label: tr.paymentRef, value: reference },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center px-5 py-3.5 gap-4">
                    <span className="text-white/45 text-sm flex-shrink-0">{label}</span>
                    <span className={`text-sm font-semibold text-right break-all ${
                      label === tr.paymentRef ? "text-sage font-mono"
                      : label === tr.amount ? "text-white text-lg font-bold"
                      : "text-white"
                    }`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-sage/10 border border-sage/25 rounded-xl px-5 py-4 text-white/65 text-sm leading-relaxed">
                <strong className="text-white">{tr.paymentNote}</strong>{" "}
                {tr.paymentNoteText.split(reference).length > 1 ? (
                  <>
                    {tr.paymentNoteText.split(reference)[0]}
                    <span className="text-sage font-mono font-semibold">{reference}</span>
                    {tr.paymentNoteText.split(reference)[1]}
                  </>
                ) : tr.paymentNoteText}
              </div>
            </div>
          </div>
        )}

        {/* Info strip */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8 text-center">
          {tr.strip.map(({ label, value }) => (
            <div key={label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-6 py-5">
              <div className="text-white/50 text-xs tracking-[0.18em] uppercase mb-1">{label}</div>
              <div className="text-white font-heading text-lg font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
    </>
  );
}
