"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LogOut, Plus, Trash2, X, Users, Euro, UtensilsCrossed,
  Loader2, AlertCircle, CheckCircle, ChevronDown, ChevronUp, RefreshCw,
  KeyRound, Eye, EyeOff, Printer, BarChart2, Sun, Moon,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList,
} from "recharts";
import type { StoredRegistration } from "@/lib/admin-types";

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_PRICE  = 125;
const EXTRA_PRICE = 20;
const MEAL_PRICE  = 35;

const MENU_LABELS: Record<string, string> = {
  "1": "Menu 1 — Veal escalope",
  "2": "Menu 2 — Salmon risotto",
  "3": "Menu 3 — Vegetarian tart",
};

const LANG_LABELS: Record<string, string> = { lu: "LU", fr: "FR", en: "EN" };

// ─── Theme helper ─────────────────────────────────────────────────────────────
// t(dark, light) — pick the right Tailwind class based on current theme.
// Used inline throughout components; each component receives `isDark` as a prop.

function mkT(isDark: boolean) {
  return (dark: string, light: string) => (isDark ? dark : light);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function inputCls(isDark: boolean, err?: string) {
  const base =
    "w-full border rounded-lg px-3.5 py-2.5 text-sm " +
    "focus:outline-none focus:ring-2 transition-[border-color,box-shadow] duration-200 ";
  const theme = isDark
    ? "bg-white/8 text-white placeholder-white/30 "
    : "bg-white text-gray-900 placeholder-gray-400 ";
  const border = err
    ? "border-red-400/50 focus:ring-red-400/30"
    : isDark
    ? "border-white/20 focus:ring-sage/40 focus:border-sage/60"
    : "border-gray-300 focus:ring-sage/50 focus:border-sage";
  return base + theme + border;
}

// ─── Add Registration Modal ───────────────────────────────────────────────────

interface MealChoice { include: boolean; menu: string; }

function AddModal({
  isDark, onClose, onAdd,
}: {
  isDark: boolean;
  onClose: () => void;
  onAdd: (r: StoredRegistration) => void;
}) {
  const t = mkT(isDark);
  const [form, setForm] = useState({
    driverName: "", copilotName: "", email: "", phone: "",
    carMake: "", carModel: "", carYear: "", lang: "en",
  });
  const [reference, setReference]   = useState("");
  const [extras, setExtras]         = useState(0);
  const [extraNames, setExtraNames] = useState<string[]>([]);
  const [mealChoices, setMealChoices] = useState<MealChoice[]>([
    { include: false, menu: "1" },
    { include: false, menu: "1" },
  ]);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(false);
  const [submitError, setSubmitError] = useState("");

  const totalPeople = 2 + extras;
  const syncedMeals: MealChoice[] = Array.from({ length: totalPeople }, (_, i) =>
    mealChoices[i] ?? { include: false, menu: "1" }
  );
  const extraCost = extras * EXTRA_PRICE;
  const mealCost  = syncedMeals.filter((m) => m.include).length * MEAL_PRICE;
  const total     = BASE_PRICE + extraCost + mealCost;

  const setF = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  };

  const addExtra = () => {
    if (extras >= 2) return;
    setExtras((n) => n + 1);
    setExtraNames((p) => [...p, ""]);
    setMealChoices((p) => [...p, { include: false, menu: "1" }]);
  };
  const removeExtra = () => {
    if (extras === 0) return;
    setExtras((n) => n - 1);
    setExtraNames((p) => p.slice(0, -1));
    setMealChoices((p) => p.slice(0, -1));
  };
  const toggleMeal = (i: number) =>
    setMealChoices((p) => p.map((m, idx) => (idx === i ? { ...m, include: !m.include } : m)));
  const setMenu = (i: number, menu: string) =>
    setMealChoices((p) => p.map((m, idx) => (idx === i ? { ...m, menu } : m)));

  const participantLabel = (i: number) => {
    if (i === 0) return form.driverName || "Driver";
    if (i === 1) return form.copilotName || "Co-pilot";
    return extraNames[i - 2] || `Extra ${i - 1}`;
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!reference.trim()) e.reference = "Required";
    if (!form.driverName.trim()) e.driverName = "Required";
    if (!form.copilotName.trim()) e.copilotName = "Required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.carMake.trim()) e.carMake = "Required";
    if (!form.carModel.trim()) e.carModel = "Required";
    const yr = Number(form.carYear);
    if (!form.carYear || !/^\d{4}$/.test(form.carYear) || yr < 1900 || yr > 2026) e.carYear = "Valid year required";
    extraNames.forEach((n, i) => { if (!n.trim()) e[`ex_${i}`] = "Required"; });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, reference: reference.trim(), extraParticipants: extras, extraNames, mealChoices: syncedMeals, mealCost, total }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const newReg = await res.json();
      onAdd(newReg);
      onClose();
    } catch {
      setSubmitError("Failed to save registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm py-8 px-4">
      <div className={`relative w-full max-w-2xl border rounded-2xl shadow-2xl ${t("bg-[#1e3528] border-white/15", "bg-white border-gray-200")}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${t("border-white/10", "border-gray-100")}`}>
          <div>
            <div className="text-sage text-xs font-semibold tracking-[0.22em] uppercase mb-0.5">Admin Entry</div>
            <h2 className={`font-heading text-xl font-bold ${t("text-white", "text-gray-900")}`}>Add Registration</h2>
          </div>
          <button onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${t("hover:bg-white/10 text-white/50 hover:text-white", "hover:bg-gray-100 text-gray-400 hover:text-gray-700")}`}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {submitError && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" /> {submitError}
            </div>
          )}

          {/* Reference */}
          <section>
            <h3 className={`text-xs font-semibold tracking-[0.2em] uppercase mb-3 ${t("text-white/70", "text-gray-500")}`}>Reference</h3>
            <input type="text" placeholder="e.g. RIST-2026-XXXXXX" value={reference}
              onChange={(e) => { setReference(e.target.value.toUpperCase()); setErrors((p) => { const n = { ...p }; delete n.reference; return n; }); }}
              className={inputCls(isDark, errors.reference)} />
            {errors.reference && <p className="mt-1 text-red-400 text-xs">{errors.reference}</p>}
          </section>

          {/* Team */}
          <section>
            <h3 className={`text-xs font-semibold tracking-[0.2em] uppercase mb-3 ${t("text-white/70", "text-gray-500")}`}>Team Information</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: "driverName", label: "Driver Name", ph: "First & Last name" },
                { key: "copilotName", label: "Co-pilot Name", ph: "First & Last name" },
                { key: "email", label: "Email", ph: "email@example.com" },
                { key: "phone", label: "Phone", ph: "+352 xxx xxx xxx" },
              ].map(({ key, label, ph }) => (
                <div key={key}>
                  <label className={`block text-xs font-medium mb-1 ${t("text-white/60", "text-gray-500")}`}>{label} <span className="text-red-400">*</span></label>
                  <input type={key === "email" ? "email" : "text"} placeholder={ph} value={(form as Record<string, string>)[key]}
                    onChange={(e) => setF(key, e.target.value)} className={inputCls(isDark, errors[key])} />
                  {errors[key] && <p className="mt-1 text-red-400 text-xs">{errors[key]}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* Vehicle */}
          <section>
            <h3 className={`text-xs font-semibold tracking-[0.2em] uppercase mb-3 ${t("text-white/70", "text-gray-500")}`}>Vehicle</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: "carMake", label: "Make", ph: "e.g. Porsche" },
                { key: "carModel", label: "Model", ph: "e.g. 911" },
                { key: "carYear", label: "Year", ph: "e.g. 1987" },
              ].map(({ key, label, ph }) => (
                <div key={key}>
                  <label className={`block text-xs font-medium mb-1 ${t("text-white/60", "text-gray-500")}`}>{label} <span className="text-red-400">*</span></label>
                  <input type="text" placeholder={ph} maxLength={key === "carYear" ? 4 : undefined}
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setF(key, key === "carYear" ? e.target.value.replace(/\D/g, "") : e.target.value)}
                    className={inputCls(isDark, errors[key])} />
                  {errors[key] && <p className="mt-1 text-red-400 text-xs">{errors[key]}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* Extra participants */}
          <section>
            <h3 className={`text-xs font-semibold tracking-[0.2em] uppercase mb-3 ${t("text-white/70", "text-gray-500")}`}>
              Extra Participants <span className={`font-normal normal-case ${t("text-white/40", "text-gray-400")}`}>— €{EXTRA_PRICE}/person</span>
            </h3>
            <div className="flex items-center gap-4 mb-3">
              <button onClick={removeExtra} disabled={extras === 0}
                className={`w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-30 transition-colors ${t("border-white/20 text-white hover:bg-white/10", "border-gray-300 text-gray-700 hover:bg-gray-100")}`}>
                <ChevronDown size={15} />
              </button>
              <span className={`font-heading text-xl font-bold w-5 text-center ${t("text-white", "text-gray-900")}`}>{extras}</span>
              <button onClick={addExtra} disabled={extras >= 2}
                className={`w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-30 transition-colors ${t("border-white/20 text-white hover:bg-white/10", "border-gray-300 text-gray-700 hover:bg-gray-100")}`}>
                <ChevronUp size={15} />
              </button>
            </div>
            {extraNames.map((name, i) => (
              <div key={i} className="mb-2">
                <label className={`block text-xs font-medium mb-1 ${t("text-white/60", "text-gray-500")}`}>Extra {i + 1} Name <span className="text-red-400">*</span></label>
                <input type="text" placeholder="First & Last name" value={name}
                  onChange={(e) => setExtraNames((p) => p.map((n, idx) => (idx === i ? e.target.value : n)))}
                  className={inputCls(isDark, errors[`ex_${i}`])} />
                {errors[`ex_${i}`] && <p className="mt-1 text-red-400 text-xs">{errors[`ex_${i}`]}</p>}
              </div>
            ))}
          </section>

          {/* Meals */}
          <section>
            <h3 className={`text-xs font-semibold tracking-[0.2em] uppercase mb-3 ${t("text-white/70", "text-gray-500")}`}>
              Meal Options <span className={`font-normal normal-case ${t("text-white/40", "text-gray-400")}`}>— €{MEAL_PRICE}/person</span>
            </h3>
            <div className="space-y-2">
              {syncedMeals.map((meal, i) => (
                <div key={i} className={`border rounded-xl p-3.5 ${t("bg-white/5 border-white/10", "bg-gray-50 border-gray-200")}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${t("text-white/70", "text-gray-600")}`}>{participantLabel(i)}</span>
                    <button onClick={() => toggleMeal(i)}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${meal.include ? "bg-sage" : t("bg-white/20", "bg-gray-300")}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${meal.include ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                  {meal.include && (
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      {["1", "2", "3"].map((m) => (
                        <button key={m} onClick={() => setMenu(i, m)}
                          className={`text-left px-2.5 py-2 rounded-lg border text-xs transition-colors duration-200 ${
                            meal.menu === m
                              ? "bg-sage/20 border-sage text-forest"
                              : t("bg-white/5 border-white/15 text-white/50 hover:border-white/30", "bg-white border-gray-200 text-gray-500 hover:border-gray-400")
                          }`}>
                          {MENU_LABELS[m]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Language + totals */}
          <section>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className={`block text-xs font-medium mb-1 ${t("text-white/60", "text-gray-500")}`}>Language</label>
                <select value={form.lang} onChange={(e) => setF("lang", e.target.value)}
                  className={`w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/40 ${t("bg-white/8 border-white/20 text-white", "bg-white border-gray-300 text-gray-900")}`}>
                  <option value="lu">Luxembourgish</option>
                  <option value="fr">French</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className={`border rounded-xl px-5 py-3 text-right ${t("bg-white/5 border-white/10", "bg-gray-50 border-gray-200")}`}>
                <div className={`text-xs mb-0.5 ${t("text-white/50", "text-gray-400")}`}>Total</div>
                <div className={`font-heading text-2xl font-bold ${t("text-white", "text-gray-900")}`}>€{total}</div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-end gap-3 ${t("border-white/10", "border-gray-100")}`}>
          <button onClick={onClose} className={`px-5 py-2.5 rounded-full border text-sm transition-colors ${t("border-white/20 text-white/70 hover:bg-white/10", "border-gray-300 text-gray-600 hover:bg-gray-100")}`}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-6 py-2.5 rounded-full bg-sage text-forest font-semibold text-sm hover:bg-sage-light disabled:opacity-60 transition-[background-color,opacity] duration-200 flex items-center gap-2 shadow-[0_4px_16px_rgba(82,183,136,0.3)]">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><CheckCircle size={14} /> Save Registration</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Change Password Modal ────────────────────────────────────────────────────

function ChangePasswordModal({ isDark, onClose }: { isDark: boolean; onClose: () => void }) {
  const t = mkT(isDark);
  const [newPassword, setNewPassword]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = (p: string) => {
    if (p.length === 0) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very strong"];
  const strengthColor = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-sage", "bg-emerald-400"];
  const s = strength(newPassword);

  const handleSubmit = async () => {
    setError("");
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to update password"); return; }
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className={`relative w-full max-w-sm border rounded-2xl shadow-2xl ${t("bg-[#1e3528] border-white/15", "bg-white border-gray-200")}`}>
        <div className={`flex items-center justify-between px-6 py-5 border-b ${t("border-white/10", "border-gray-100")}`}>
          <div>
            <div className="text-sage text-xs font-semibold tracking-[0.22em] uppercase mb-0.5">Account</div>
            <h2 className={`font-heading text-xl font-bold ${t("text-white", "text-gray-900")}`}>Change Password</h2>
          </div>
          <button onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${t("hover:bg-white/10 text-white/50 hover:text-white", "hover:bg-gray-100 text-gray-400 hover:text-gray-700")}`}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-sage/20 flex items-center justify-center">
                <CheckCircle size={22} className="text-sage" />
              </div>
              <p className={`font-medium ${t("text-white", "text-gray-900")}`}>Password updated successfully</p>
              <p className={`text-sm ${t("text-white/40", "text-gray-400")}`}>Closing…</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  <AlertCircle size={15} className="flex-shrink-0" /> {error}
                </div>
              )}

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${t("text-white/70", "text-gray-600")}`}>New Password</label>
                <div className="relative">
                  <KeyRound size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${t("text-white/30", "text-gray-400")}`} />
                  <input type={showNew ? "text" : "password"} value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters"
                    className={inputCls(isDark)} style={{ paddingLeft: "2.25rem", paddingRight: "2.5rem" }} />
                  <button type="button" onClick={() => setShowNew((v) => !v)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${t("text-white/30 hover:text-white/70", "text-gray-400 hover:text-gray-600")}`}>
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= s ? strengthColor[s] : t("bg-white/10", "bg-gray-200")}`} />
                      ))}
                    </div>
                    <p className={`text-xs ${t("text-white/40", "text-gray-400")}`}>{strengthLabel[s]}</p>
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${t("text-white/70", "text-gray-600")}`}>Confirm New Password</label>
                <div className="relative">
                  <KeyRound size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${t("text-white/30", "text-gray-400")}`} />
                  <input type={showConfirm ? "text" : "password"} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                    placeholder="Repeat new password"
                    className={inputCls(isDark, confirmPassword.length > 0 && confirmPassword !== newPassword ? "mismatch" : undefined)}
                    style={{ paddingLeft: "2.25rem", paddingRight: "2.5rem" }} />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${t("text-white/30 hover:text-white/70", "text-gray-400 hover:text-gray-600")}`}>
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                  <p className="mt-1 text-red-400 text-xs">Passwords do not match</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className={`flex-1 py-2.5 rounded-full border text-sm transition-colors ${t("border-white/20 text-white/70 hover:bg-white/10", "border-gray-300 text-gray-600 hover:bg-gray-100")}`}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-2.5 rounded-full bg-sage text-forest font-semibold text-sm hover:bg-sage-light disabled:opacity-60 transition-[background-color,opacity] duration-200 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(82,183,136,0.3)]">
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Update Password"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

type TimePeriod = "day" | "week" | "month";

const PIE_COLORS = ["#52B788", "#95D5B2"];
const BAR_COLORS = ["#52B788", "#74C69D", "#40916C"];
const CHART_BAR_FILL = "#52B788";

const MENU_NAMES: Record<string, string> = {
  "1": "Wiener Schnitzel",
  "2": "Cannelloni Bolognese",
  "3": "Vegetarian Cannelloni",
};

const MENU_SHORT: Record<string, string> = {
  "1": "Wiener Schnitzel",
  "2": "Cann. Bolognese",
  "3": "Veg. Cannelloni",
};

function getWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `W${weekNo}`;
}

function buildTimeData(regs: StoredRegistration[], period: TimePeriod) {
  const counts: Record<string, number> = {};
  for (const r of regs) {
    const d = new Date(r.submittedAt);
    let key: string;
    if (period === "day")        key = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    else if (period === "week")  key = getWeekLabel(d);
    else                         key = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts).map(([label, count]) => ({ label, count }));
}

function buildRevenueData(regs: StoredRegistration[]) {
  const teamTotal = regs.length * 125;
  const mealTotal = regs.reduce((s, r) => s + r.mealChoices.filter((m) => m.include).length * 35, 0);
  return [
    { name: "Team Entry", value: teamTotal },
    { name: "Meals",      value: mealTotal },
  ].filter((d) => d.value > 0);
}

function buildMenuData(regs: StoredRegistration[]) {
  const counts: Record<string, number> = {};
  for (const r of regs)
    for (const m of r.mealChoices)
      if (m.include) counts[m.menu] = (counts[m.menu] ?? 0) + 1;
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([key, count]) => ({ name: MENU_NAMES[key] ?? `Menu ${key}`, count, key }));
}

function ChartsSection({ regs, isDark }: { regs: StoredRegistration[]; isDark: boolean }) {
  const t = mkT(isDark);
  const [period, setPeriod] = useState<TimePeriod>("day");

  const timeData    = buildTimeData(regs, period);
  const revenueData = buildRevenueData(regs);
  const menuData    = buildMenuData(regs).map((d) => ({ ...d, name: MENU_SHORT[d.key] ?? d.name }));

  const hasTimeData    = timeData.length > 0;
  const hasRevenueData = revenueData.length > 0;
  const hasMenuData    = menuData.length > 0;

  if (!hasTimeData && !hasRevenueData && !hasMenuData) return null;

  const pieTotal = revenueData.reduce((s, d) => s + d.value, 0);

  // Chart color tokens — different per theme
  const tickColor  = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)";
  const labelColor = isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)";
  const outerLabelColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.7)";
  const legendMainColor = isDark ? "rgba(255,255,255,0.8)"  : "rgba(0,0,0,0.75)";
  const legendSubColor  = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)";

  const tooltipStyle = {
    contentStyle: isDark
      ? { background: "#1e3528", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#fff", fontSize: 12 }
      : { background: "#fff",    border: "1px solid #e5e7eb",                 borderRadius: 10, color: "#111", fontSize: 12 },
    cursor: { fill: isDark ? "rgba(82,183,136,0.08)" : "rgba(82,183,136,0.1)" },
  };
  const pieTooltipStyle = {
    contentStyle: isDark
      ? { background: "#1e3528", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#fff", fontSize: 12 }
      : { background: "#fff",    border: "1px solid #e5e7eb",                 borderRadius: 10, color: "#111", fontSize: 12 },
  };

  const cardCls   = `border rounded-2xl p-4 sm:p-5 ${t("bg-white/5 border-white/10", "bg-white border-gray-200 shadow-sm")}`;
  const titleCls  = `font-semibold text-sm mb-3 ${t("text-white", "text-gray-800")}`;
  const toggleBg  = `flex gap-1 border rounded-full p-0.5 ${t("bg-white/5 border-white/10", "bg-gray-100 border-gray-200")}`;

  return (
    <div className="mb-8 space-y-4">
      {/* Registrations over time */}
      {hasTimeData && (
        <div className={cardCls}>
          <div className="flex items-center justify-between mb-4 sm:mb-5 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-sage" />
              <h3 className={titleCls}>Registrations over time</h3>
            </div>
            <div className={toggleBg}>
              {(["day", "week", "month"] as TimePeriod[]).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 sm:px-3.5 py-1 rounded-full text-xs font-semibold capitalize transition-[background-color,color] duration-200 ${
                    period === p ? "bg-sage text-forest" : t("text-white/50 hover:text-white", "text-gray-500 hover:text-gray-800")
                  }`}>
                  {p === "day" ? "Daily" : p === "week" ? "Weekly" : "Monthly"}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={timeData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v) => [v, "Registrations"]} />
              <Bar dataKey="count" fill={CHART_BAR_FILL} radius={[4, 4, 0, 0]} maxBarSize={44}>
                <LabelList dataKey="count" position="top" style={{ fill: labelColor, fontSize: 11, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Revenue + Meals row */}
      {(hasRevenueData || hasMenuData) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Revenue donut */}
          {hasRevenueData && (
            <div className={`${cardCls} flex flex-col`}>
              <h3 className={titleCls}>Revenue breakdown</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <Pie data={revenueData} cx="50%" cy="42%"
                    innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value"
                    label={({ name, value, x, y }: { name?: string; value?: number; x?: number; y?: number }) => (
                      <text x={x} y={y} textAnchor="middle" fill={outerLabelColor} fontSize={11}>
                        {`${name ?? ""} €${value ?? 0}`}
                      </text>
                    )}
                    labelLine={{ stroke: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)", strokeWidth: 1 }}
                  >
                    {revenueData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    <LabelList dataKey="percent" position="inside"
                      formatter={(v: unknown) => `${Math.round(((v as number) ?? 0) * 100)}%`}
                      style={{ fill: "rgba(20,45,32,0.95)", fontSize: 11, fontWeight: 700 }} />
                  </Pie>
                  <Tooltip {...pieTooltipStyle} formatter={(v) => [`€${v}`, ""]} />
                  <Legend iconType="circle" iconSize={9}
                    wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                    formatter={(value, entry) => {
                      const pct = pieTotal > 0
                        ? Math.round(((entry as { payload?: { value: number } }).payload?.value ?? 0) / pieTotal * 100)
                        : 0;
                      return (
                        <span style={{ color: legendMainColor }}>
                          {value}{" "}<span style={{ color: legendSubColor }}>{pct}%</span>
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Meals horizontal bar */}
          {hasMenuData && (
            <div className={`${cardCls} flex flex-col`}>
              <h3 className={titleCls}>Meals by menu</h3>
              <ResponsiveContainer width="100%" height={Math.max(180, menuData.length * 60 + 28)}>
                <BarChart data={menuData} layout="vertical" margin={{ top: 4, right: 36, left: 0, bottom: 4 }}>
                  <XAxis type="number" allowDecimals={false}
                    tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={118}
                    tick={{ fill: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)", fontSize: 10 }}
                    axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [v, "Orders"]} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={30}>
                    {menuData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                    <LabelList dataKey="count" position="right"
                      style={{ fill: labelColor, fontSize: 11, fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Print helper ─────────────────────────────────────────────────────────────

function printRegistrations(regs: StoredRegistration[]) {
  const PRINT_MENU_NAMES: Record<string, string> = {
    "1": "Menu 1 — Wiener Schnitzel",
    "2": "Menu 2 — Cannelloni Bolognese",
    "3": "Menu 3 — Vegetarian Cannelloni",
  };

  const totalRevenue = regs.reduce((s, r) => s + r.total, 0);
  const totalMeals   = regs.reduce((s, r) => s + r.mealChoices.filter((m) => m.include).length, 0);
  const totalPeople  = regs.reduce((s, r) => s + 2 + r.extraParticipants, 0);

  const rows = regs.map((r, i) => {
    const meals = r.mealChoices
      .map((m, mi) => {
        if (!m.include) return null;
        const name = mi === 0 ? r.driverName : mi === 1 ? r.copilotName : r.extraNames[mi - 2] ?? `P${mi + 1}`;
        return `${name}: ${PRINT_MENU_NAMES[m.menu] ?? m.menu}`;
      })
      .filter(Boolean).join("<br>");
    const participants = [r.driverName, r.copilotName, ...r.extraNames].join(", ");
    return `
      <tr class="${i % 2 === 0 ? "even" : ""}">
        <td class="ref">${r.reference}</td>
        <td>${new Date(r.submittedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
        <td>${participants}</td>
        <td>${r.email}<br><span class="sub">${r.phone}</span></td>
        <td>${r.carMake} ${r.carModel}<br><span class="sub">${r.carYear}</span></td>
        <td class="center">${meals || '<span class="none">—</span>'}</td>
        <td class="center amount">€${r.total}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>RIST 2026 — Registrations</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: white; }
    .header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 3px solid #2D6A4F; }
    .header-left h1 { font-size: 18px; font-weight: bold; color: #2D6A4F; }
    .header-left p { font-size: 11px; color: #666; margin-top: 3px; }
    .header-right { text-align: right; font-size: 10px; color: #888; }
    .stats { display: flex; gap: 0; border-bottom: 1px solid #ddd; }
    .stat { flex: 1; padding: 10px 24px; border-right: 1px solid #ddd; }
    .stat:last-child { border-right: none; }
    .stat-value { font-size: 20px; font-weight: bold; color: #2D6A4F; line-height: 1; }
    .stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-top: 2px; }
    .table-wrap { padding: 16px 24px 0; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #2D6A4F; }
    thead th { padding: 7px 8px; text-align: left; color: white; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; }
    tbody tr { border-bottom: 1px solid #eee; }
    tbody tr.even { background: #f8fcf9; }
    tbody td { padding: 6px 8px; vertical-align: top; line-height: 1.4; }
    .ref { font-family: monospace; font-size: 10px; color: #2D6A4F; font-weight: bold; white-space: nowrap; }
    .sub { color: #888; font-size: 10px; }
    .center { text-align: center; }
    .amount { font-weight: bold; white-space: nowrap; }
    .none { color: #bbb; }
    .footer { margin: 16px 24px 0; padding: 12px 0; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 9px; color: #aaa; }
    @page { size: A4 landscape; margin: 10mm; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>Rotary Indian Summer Tour 2026</h1>
      <p>Staff Portal — Registration List</p>
    </div>
    <div class="header-right">
      Printed ${new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}<br>
      Rotary Club Bascharage-Kordall
    </div>
  </div>
  <div class="stats">
    <div class="stat"><div class="stat-value">${regs.length}</div><div class="stat-label">Registrations</div></div>
    <div class="stat"><div class="stat-value">${totalPeople}</div><div class="stat-label">Participants</div></div>
    <div class="stat"><div class="stat-value">${totalMeals}</div><div class="stat-label">Meals ordered</div></div>
    <div class="stat"><div class="stat-value">€${totalRevenue}</div><div class="stat-label">Total revenue</div></div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Reference</th><th>Date</th><th>Participants</th><th>Contact</th><th>Vehicle</th><th>Meals</th><th>Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <div class="footer">
    <span>${regs.length} registration${regs.length !== 1 ? "s" : ""} · Sunday 6 September 2026 · Mess-Café, Reckange-sur-Mess</span>
    <span>Am Déngscht vun deenen aneren</span>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=1100,height=750");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard({
  initialRegistrations,
  username,
}: {
  initialRegistrations: StoredRegistration[];
  username: string;
}) {
  const router = useRouter();
  const [regs, setRegs] = useState<StoredRegistration[]>(initialRegistrations);
  const [showAdd, setShowAdd]                 = useState(false);
  const [deleteId, setDeleteId]               = useState<string | null>(null);
  const [deleting, setDeleting]               = useState(false);
  const [logoutLoading, setLogoutLoading]     = useState(false);
  const [refreshing, setRefreshing]           = useState(false);
  const [showUserMenu, setShowUserMenu]       = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(true); // default: dark
  useEffect(() => {
    const saved = localStorage.getItem("rist-admin-theme");
    if (saved === "light") setIsDark(false);
    else if (saved === "dark") setIsDark(true);
  }, []);
  const toggleTheme = () => {
    setIsDark((v) => {
      const next = !v;
      localStorage.setItem("rist-admin-theme", next ? "dark" : "light");
      return next;
    });
  };

  const t = mkT(isDark);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/registrations");
      if (res.ok) setRegs(await res.json());
    } finally {
      setRefreshing(false);
    }
  };

  const totalRevenue = regs.reduce((s, r) => s + r.total, 0);
  const totalMeals   = regs.reduce((s, r) => s + r.mealChoices.filter((m) => m.include).length, 0);

  const handleLogout = async () => {
    setLogoutLoading(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch("/api/admin/registrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId }),
      });
      setRegs((p) => p.filter((r) => r.id !== deleteId));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${t("bg-[#1a2e24]", "bg-[#f0f4f2]")}`}>

      {/* ── Navbar ── */}
      <header className={`border-b px-6 lg:px-10 py-3 flex items-center justify-between gap-4 ${t("bg-[#152619] border-white/8", "bg-white border-gray-200 shadow-sm")}`}>
        <div className="flex items-center gap-4">
          <Image src="/rally-logo.png" alt="RIST 2026" width={1184} height={621} className="h-24 w-auto" />
          <div className={`hidden sm:block h-5 w-px ${t("bg-white/20", "bg-gray-300")}`} />
          <span className={`hidden sm:block text-xs tracking-[0.2em] uppercase ${t("text-white/50", "text-gray-400")}`}>Staff Portal</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors duration-200 ${t("border-white/20 text-white/50 hover:text-white hover:bg-white/10", "border-gray-300 text-gray-400 hover:text-gray-700 hover:bg-gray-100")}`}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* User dropdown */}
          <div className="relative">
            <button onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-2 bg-sage/10 border border-sage/20 rounded-full px-3 py-1.5 hover:bg-sage/15 transition-colors">
              <div className="w-5 h-5 rounded-full bg-sage/30 flex items-center justify-center text-sage text-[10px] font-bold">
                {username[0]?.toUpperCase()}
              </div>
              <span className="text-sage text-xs font-medium">{username}</span>
              <ChevronDown size={11} className={`text-sage/60 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`} />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className={`absolute right-0 top-full mt-2 w-44 border rounded-xl shadow-2xl overflow-hidden z-20 ${t("bg-[#1e3528] border-white/15", "bg-white border-gray-200")}`}>
                  <button
                    onClick={() => { setShowChangePassword(true); setShowUserMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors ${t("text-white/70 hover:bg-white/8 hover:text-white", "text-gray-600 hover:bg-gray-50 hover:text-gray-900")}`}>
                    <KeyRound size={14} className="text-sage/70" />
                    Change Password
                  </button>
                  <div className={`border-t ${t("border-white/8", "border-gray-100")}`} />
                  <button onClick={handleLogout} disabled={logoutLoading}
                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors disabled:opacity-40 ${t("text-white/50 hover:bg-white/8 hover:text-white/80", "text-gray-500 hover:bg-gray-50 hover:text-gray-800")}`}>
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Users size={18} className="text-sage" />,           value: regs.length,    label: "Registrations", sub: "out of 60" },
            { icon: <Euro size={18} className="text-sage" />,             value: `€${totalRevenue}`, label: "Total Revenue", sub: "collected" },
            { icon: <UtensilsCrossed size={18} className="text-sage" />, value: totalMeals,     label: "Meals Ordered",  sub: "total covers" },
          ].map(({ icon, value, label, sub }) => (
            <div key={label} className={`border rounded-2xl px-5 py-4 transition-colors ${t("bg-white/5 border-white/10", "bg-white border-gray-200 shadow-sm")}`}>
              <div className="flex items-center gap-2 mb-2">{icon}</div>
              <div className={`font-heading text-2xl font-bold leading-none ${t("text-white", "text-gray-900")}`}>{value}</div>
              <div className={`text-xs mt-1 ${t("text-white/60", "text-gray-500")}`}>{label}</div>
              <div className={`text-xs ${t("text-white/30", "text-gray-400")}`}>{sub}</div>
            </div>
          ))}
        </div>

        {/* ── Charts ── */}
        <ChartsSection regs={regs} isDark={isDark} />

        {/* ── Table header ── */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className={`font-heading text-xl font-bold ${t("text-white", "text-gray-900")}`}>Registrations</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} disabled={refreshing} title="Refresh list"
              className={`w-9 h-9 rounded-full border flex items-center justify-center disabled:opacity-40 transition-colors duration-200 ${t("border-white/20 text-white/50 hover:text-white hover:bg-white/10", "border-gray-300 text-gray-400 hover:text-gray-700 hover:bg-gray-100")}`}>
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-sage text-forest font-semibold text-sm hover:bg-sage-light active:scale-[0.98] transition-[background-color,transform] duration-200 shadow-[0_4px_16px_rgba(82,183,136,0.3)]">
              <Plus size={15} /> Add Registration
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        {regs.length === 0 ? (
          <div className={`border rounded-2xl px-6 py-16 text-center ${t("bg-white/5 border-white/10", "bg-white border-gray-200")}`}>
            <Users size={36} className={`mx-auto mb-3 ${t("text-white/20", "text-gray-300")}`} />
            <p className={`text-sm ${t("text-white/40", "text-gray-400")}`}>No registrations yet.</p>
          </div>
        ) : (
          <div className={`border rounded-2xl overflow-hidden ${t("bg-white/5 border-white/10", "bg-white border-gray-200 shadow-sm")}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className={`border-b ${t("border-white/10 bg-white/5", "border-gray-200 bg-gray-50")}`}>
                    {["Reference", "Date", "Driver / Co-pilot", "Email", "Car", "Extras", "Meals", "Total", "Lang", ""].map((h) => (
                      <th key={h} className={`px-4 py-3 text-left text-xs font-semibold tracking-[0.12em] uppercase whitespace-nowrap ${t("text-white/50", "text-gray-500")}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${t("divide-white/8", "divide-gray-100")}`}>
                  {regs.map((r) => (
                    <tr key={r.id} className={`transition-colors ${t("hover:bg-white/5", "hover:bg-gray-50")}`}>
                      <td className="px-4 py-3.5 font-mono text-sage text-xs whitespace-nowrap">{r.reference}</td>
                      <td className={`px-4 py-3.5 text-xs whitespace-nowrap ${t("text-white/50", "text-gray-400")}`}>{formatDate(r.submittedAt)}</td>
                      <td className="px-4 py-3.5">
                        <div className={`text-xs font-medium ${t("text-white", "text-gray-900")}`}>{r.driverName}</div>
                        <div className={`text-xs ${t("text-white/50", "text-gray-500")}`}>{r.copilotName}</div>
                        {r.extraNames.map((n) => (
                          <div key={n} className={`text-xs ${t("text-white/40", "text-gray-400")}`}>+{n}</div>
                        ))}
                      </td>
                      <td className="px-4 py-3.5">
                        <a href={`mailto:${r.email}`} className={`text-xs hover:text-sage transition-colors ${t("text-white/60", "text-gray-600")}`}>{r.email}</a>
                        <div className={`text-xs mt-0.5 ${t("text-white/30", "text-gray-400")}`}>{r.phone}</div>
                      </td>
                      <td className={`px-4 py-3.5 text-xs whitespace-nowrap ${t("text-white/70", "text-gray-700")}`}>
                        {r.carMake} {r.carModel}
                        <div className={`text-xs ${t("text-white/30", "text-gray-400")}`}>{r.carYear}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.extraParticipants > 0 ? "bg-sage/15 text-sage" : t("text-white/30", "text-gray-400")
                        }`}>
                          {r.extraParticipants > 0 ? `+${r.extraParticipants}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {r.mealChoices.filter((m) => m.include).length > 0 ? (
                          <div className="space-y-0.5">
                            {r.mealChoices.map((m, i) => m.include && (
                              <div key={i} className={`text-xs whitespace-nowrap ${t("text-white/60", "text-gray-600")}`}>
                                {i === 0 ? r.driverName : i === 1 ? r.copilotName : r.extraNames[i - 2] || `P${i + 1}`}: M{m.menu}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className={`text-xs ${t("text-white/25", "text-gray-400")}`}>No meals</span>
                        )}
                      </td>
                      <td className={`px-4 py-3.5 font-heading font-bold whitespace-nowrap ${t("text-white", "text-gray-900")}`}>€{r.total}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${t("bg-white/8 text-white/50", "bg-gray-100 text-gray-500")}`}>
                          {LANG_LABELS[r.lang] ?? r.lang}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => setDeleteId(r.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-400/15 transition-colors duration-200">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Print button ── */}
        {regs.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button onClick={() => printRegistrations(regs)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm transition-colors duration-200 ${t("border-white/20 text-white/60 hover:bg-white/8 hover:text-white", "border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-800")}`}>
              <Printer size={15} />
              Print Registration List
            </button>
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      {showChangePassword && (
        <ChangePasswordModal isDark={isDark} onClose={() => setShowChangePassword(false)} />
      )}
      {showAdd && (
        <AddModal isDark={isDark} onClose={() => setShowAdd(false)} onAdd={(r) => setRegs((p) => [r, ...p])} />
      )}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className={`border rounded-2xl p-7 max-w-sm w-full shadow-2xl text-center ${t("bg-[#1e3528] border-white/15", "bg-white border-gray-200")}`}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h3 className={`font-heading text-lg font-bold mb-2 ${t("text-white", "text-gray-900")}`}>Delete Registration?</h3>
            <p className={`text-sm mb-6 ${t("text-white/50", "text-gray-500")}`}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className={`flex-1 py-2.5 rounded-full border text-sm transition-colors ${t("border-white/20 text-white/70 hover:bg-white/10", "border-gray-300 text-gray-600 hover:bg-gray-100")}`}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-full bg-red-500 text-white font-semibold text-sm hover:bg-red-400 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {deleting ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
