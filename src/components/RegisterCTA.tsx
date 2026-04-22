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
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const MENUS = [
  { id: "1", label: "Menu 1", dish: "Wiener Schnitzel" },
  { id: "2", label: "Menu 2", dish: "Cannelloni Bolognese" },
  { id: "3", label: "Menu 3", dish: "Vegetarian Cannelloni" },
];

const BASE_PRICE = 125;
const EXTRA_PRICE = 20;
const MEAL_PRICE = 35;

const BANK_IBAN = "LU80 0019 4955 0049 5000";
const BANK_BIC = "BGLLLULL";
const BANK_NAME = "BGL BNP Paribas";
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
  const topRef = useRef<HTMLDivElement>(null);

  // Form state
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

  // Flow state
  const [step, setStep] = useState<Step>("form");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

  // ── Participant helpers ─────────────────────────────────────────────────────

  const addExtra = () => {
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

  // ── Meal helpers ────────────────────────────────────────────────────────────

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

    if (!form.driverName.trim()) e.driverName = "Driver name is required";
    if (!form.copilotName.trim()) e.copilotName = "Co-pilot name is required";

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "A valid email address is required";

    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 6)
      e.phone = "A valid phone number is required";

    if (!form.carMake.trim()) e.carMake = "Car make is required";
    if (!form.carModel.trim()) e.carModel = "Car model is required";

    const year = Number(form.carYear);
    if (!form.carYear.trim() || !/^\d{4}$/.test(form.carYear) || year < 1900 || year > 2026)
      e.carYear = "Enter a valid 4-digit year";

    extraNames.forEach((name, i) => {
      if (!name.trim()) e[`extra_${i}`] = "Name is required";
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

  // ── Participant label helper ─────────────────────────────────────────────────

  const participantLabel = (i: number) => {
    if (i === 0) return `${form.driverName || "Driver"} (Person 1)`;
    if (i === 1) return `${form.copilotName || "Co-pilot"} (Person 2)`;
    return `${extraNames[i - 2] || `Extra ${i - 1}`} (Person ${i + 1})`;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <section id="register" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
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
            <span className="text-sage text-xs font-semibold tracking-[0.28em] uppercase">Registration</span>
            <div className="h-px w-10 bg-sage/50" />
          </div>
          <h2 className="font-heading text-white text-4xl sm:text-5xl font-bold tracking-[-0.02em]">
            Secure Your Place
          </h2>
          <p className="mt-4 text-white/65 text-lg max-w-xl mx-auto leading-relaxed">
            Limited to 70 registrations, by order of payment.
          </p>
        </div>

        {/* ── STEP: FORM ────────────────────────────────────────────────────── */}
        {step === "form" && (
          <div className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl overflow-hidden">

            {/* Entry fee header */}
            <div className="p-8 border-b border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sage text-xs font-semibold tracking-[0.22em] uppercase mb-1">Team Entry</div>
                  <h3 className="font-heading text-white text-2xl font-bold">2 Persons per Vehicle</h3>
                  <ul className="mt-3 space-y-1.5">
                    {["Snack", "Roadbook with arrows", "Official rally plate"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-white/65 text-sm">
                        <span className="w-4 h-4 rounded-full bg-sage/20 text-sage flex items-center justify-center text-[10px] font-bold flex-shrink-0">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-heading text-white text-4xl font-bold">€{BASE_PRICE}</div>
                  <div className="text-white/40 text-xs mt-1">per team</div>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">

              {/* ── Global error ── */}
              {(Object.keys(errors).length > 0 || submitError) && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3">
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-red-300 text-sm">
                    {submitError ||
                      "Please fill in all required fields correctly before submitting."}
                  </div>
                </div>
              )}

              {/* ── Team information ── */}
              <div>
                <h4 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sage/20 text-sage text-xs font-bold flex items-center justify-center">1</span>
                  Team Information
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <InputField label="Driver Name" required error={errors.driverName}>
                    <input
                      type="text"
                      placeholder="First and last name"
                      value={form.driverName}
                      onChange={(e) => setField("driverName", e.target.value)}
                      className={inputClass(errors.driverName)}
                    />
                  </InputField>
                  <InputField label="Co-pilot Name" required error={errors.copilotName}>
                    <input
                      type="text"
                      placeholder="First and last name"
                      value={form.copilotName}
                      onChange={(e) => setField("copilotName", e.target.value)}
                      className={inputClass(errors.copilotName)}
                    />
                  </InputField>
                  <InputField label="Email Address" required error={errors.email}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      className={inputClass(errors.email)}
                    />
                  </InputField>
                  <InputField label="Phone Number" required error={errors.phone}>
                    <input
                      type="tel"
                      placeholder="+352 xxx xxx xxx"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      className={inputClass(errors.phone)}
                    />
                  </InputField>
                </div>
              </div>

              {/* ── Vehicle information ── */}
              <div>
                <h4 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sage/20 text-sage text-xs font-bold flex items-center justify-center">2</span>
                  Vehicle Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <InputField label="Make" required error={errors.carMake}>
                    <input
                      type="text"
                      placeholder="e.g. Porsche"
                      value={form.carMake}
                      onChange={(e) => setField("carMake", e.target.value)}
                      className={inputClass(errors.carMake)}
                    />
                  </InputField>
                  <InputField label="Model" required error={errors.carModel}>
                    <input
                      type="text"
                      placeholder="e.g. 911"
                      value={form.carModel}
                      onChange={(e) => setField("carModel", e.target.value)}
                      className={inputClass(errors.carModel)}
                    />
                  </InputField>
                  <InputField label="Year" required error={errors.carYear}>
                    <input
                      type="text"
                      placeholder="e.g. 1974"
                      maxLength={4}
                      value={form.carYear}
                      onChange={(e) => setField("carYear", e.target.value.replace(/\D/g, ""))}
                      className={inputClass(errors.carYear)}
                    />
                  </InputField>
                </div>
              </div>

              {/* ── Extra participants ── */}
              <div>
                <h4 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sage/20 text-sage text-xs font-bold flex items-center justify-center">3</span>
                  Extra Participants
                  <span className="text-white/40 text-xs font-normal ml-1">— €{EXTRA_PRICE} / person</span>
                </h4>
                <div className="flex items-center gap-5 mb-4">
                  <button
                    onClick={removeExtra}
                    disabled={extraParticipants === 0}
                    aria-label="Remove participant"
                    className="w-9 h-9 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-[background-color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-heading text-white text-2xl font-bold w-6 text-center">{extraParticipants}</span>
                  <button
                    onClick={addExtra}
                    aria-label="Add participant"
                    className="w-9 h-9 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/10 transition-[background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage"
                  >
                    <Plus size={16} />
                  </button>
                  {extraParticipants > 0 && (
                    <span className="text-white/50 text-sm">
                      +€{extraCost}
                    </span>
                  )}
                </div>

                {extraNames.map((name, i) => (
                  <div key={i} className="mb-3">
                    <InputField
                      label={`Extra Participant ${i + 1} — Name`}
                      required
                      error={errors[`extra_${i}`]}
                    >
                      <input
                        type="text"
                        placeholder="First and last name"
                        value={name}
                        onChange={(e) => setExtraName(i, e.target.value)}
                        className={inputClass(errors[`extra_${i}`])}
                      />
                    </InputField>
                  </div>
                ))}
              </div>

              {/* ── Meal options ── */}
              <div>
                <h4 className="text-white font-semibold text-base mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sage/20 text-sage text-xs font-bold flex items-center justify-center">4</span>
                  Meal Options
                  <span className="text-white/40 text-xs font-normal ml-1">— €{MEAL_PRICE} / person</span>
                </h4>
                <p className="text-white/45 text-sm mb-4 ml-8">Main course, dessert &amp; coffee</p>

                <div className="space-y-3">
                  {syncedMeals.map((meal, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white/75 text-sm font-medium">{participantLabel(i)}</span>
                        <button
                          onClick={() => toggleMeal(i)}
                          aria-label={`Toggle meal for ${participantLabel(i)}`}
                          className={`relative w-11 h-6 rounded-full transition-[background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage ${
                            meal.include ? "bg-sage" : "bg-white/20"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                              meal.include ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {meal.include && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {MENUS.map((menu) => (
                            <button
                              key={menu.id}
                              onClick={() => setMenu(i, menu.id)}
                              className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-[background-color,border-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage ${
                                meal.menu === menu.id
                                  ? "bg-sage/20 border-sage text-white"
                                  : "bg-white/5 border-white/15 text-white/60 hover:border-white/30 hover:text-white/80"
                              }`}
                            >
                              <div className="font-semibold text-xs tracking-wide">{menu.label}</div>
                              <div className="text-[11px] mt-0.5 opacity-80">{menu.dish}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Price summary ── */}
              <div className="bg-white/5 rounded-xl border border-white/10 px-6 py-5">
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-white/60 text-sm">
                    <span>Team entry (2 persons)</span>
                    <span>€{BASE_PRICE}</span>
                  </div>
                  {extraParticipants > 0 && (
                    <div className="flex justify-between text-white/60 text-sm">
                      <span>Extra participant(s) ({extraParticipants} × €{EXTRA_PRICE})</span>
                      <span>€{extraCost}</span>
                    </div>
                  )}
                  {mealCost > 0 && (
                    <div className="flex justify-between text-white/60 text-sm">
                      <span>Meals ({syncedMeals.filter((m) => m.include).length} × €{MEAL_PRICE})</span>
                      <span>€{mealCost}</span>
                    </div>
                  )}
                  <div className="border-t border-white/15 pt-3 flex justify-between items-baseline">
                    <span className="text-white font-semibold">Total</span>
                    <span className="font-heading text-white text-3xl font-bold">€{total}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-sage text-forest font-semibold text-sm text-center hover:bg-sage-light active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-[background-color,transform,opacity] duration-200 shadow-[0_8px_32px_rgba(82,183,136,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Processing…</>
                  ) : (
                    `Send Registration — €${total}`
                  )}
                </button>
                <p className="text-white/30 text-xs text-center mt-3">
                  A confirmation email will be sent to the organising team upon submission.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: BANK TRANSFER ───────────────────────────────────────────── */}
        {step === "bank" && (
          <div className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl overflow-hidden">

            {/* Confirmation banner */}
            <div className="p-6 border-b border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={22} className="text-sage" />
              </div>
              <div>
                <div className="text-white font-semibold">Registration received</div>
                <div className="text-white/50 text-sm">
                  Reference: <span className="text-sage font-mono font-semibold">{reference}</span>
                  {" "}· Total: <span className="text-white font-semibold">€{total}</span>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-sage/15 flex items-center justify-center flex-shrink-0">
                  <Building2 size={22} className="text-sage" />
                </div>
                <div>
                  <h3 className="font-heading text-white text-2xl font-bold leading-tight">Bank Transfer Details</h3>
                  <p className="text-white/50 text-sm">Please complete your payment to confirm your place.</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/10 mb-6">
                {[
                  { label: "Account Name", value: ACCOUNT_NAME },
                  { label: "Bank", value: BANK_NAME },
                  { label: "IBAN", value: BANK_IBAN },
                  { label: "BIC / SWIFT", value: BANK_BIC },
                  { label: "Amount", value: `€${total}` },
                  { label: "Payment Reference", value: reference },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center px-5 py-3.5 gap-4">
                    <span className="text-white/45 text-sm flex-shrink-0">{label}</span>
                    <span
                      className={`text-sm font-semibold text-right break-all ${
                        label === "Payment Reference"
                          ? "text-sage font-mono"
                          : label === "Amount"
                          ? "text-white text-lg font-bold"
                          : "text-white"
                      }`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-sage/10 border border-sage/25 rounded-xl px-5 py-4 text-white/65 text-sm leading-relaxed">
                <strong className="text-white">Important:</strong> Please include your reference number{" "}
                <span className="text-sage font-mono font-semibold">{reference}</span> in the payment
                description so we can identify your registration. Your place will be confirmed once
                payment is received. SEPA transfers typically process within 1–3 banking days.
              </div>
            </div>
          </div>
        )}

        {/* Info strip */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8 text-center">
          {[
            { label: "Registration", value: "Now Open" },
            { label: "Registration Deadline", value: "25 August 2026" },
            { label: "Places Limited", value: "70 registrations — by order of payment" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-6 py-5">
              <div className="text-white/50 text-xs tracking-[0.18em] uppercase mb-1">{label}</div>
              <div className="text-white font-heading text-lg font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
