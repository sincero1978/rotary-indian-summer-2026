"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LogOut, Plus, Trash2, X, Users, Euro, UtensilsCrossed,
  Loader2, AlertCircle, CheckCircle, ChevronDown, ChevronUp, RefreshCw,
  KeyRound, Eye, EyeOff,
} from "lucide-react";
import type { StoredRegistration } from "@/lib/admin-types";

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_PRICE = 125;
const EXTRA_PRICE = 20;
const MEAL_PRICE = 35;

const MENU_LABELS: Record<string, string> = {
  "1": "Menu 1 — Veal escalope",
  "2": "Menu 2 — Salmon risotto",
  "3": "Menu 3 — Vegetarian tart",
};

const LANG_LABELS: Record<string, string> = { lu: "LU", fr: "FR", en: "EN" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function inputCls(err?: string) {
  return (
    "w-full bg-white/8 border rounded-lg px-3.5 py-2.5 text-white placeholder-white/30 text-sm " +
    "focus:outline-none focus:ring-2 transition-[border-color,box-shadow] duration-200 " +
    (err
      ? "border-red-400/50 focus:ring-red-400/30"
      : "border-white/20 focus:ring-sage/40 focus:border-sage/60")
  );
}

// ─── Add Registration Modal ───────────────────────────────────────────────────

interface MealChoice { include: boolean; menu: string; }

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (r: StoredRegistration) => void }) {
  const [form, setForm] = useState({
    driverName: "", copilotName: "", email: "", phone: "",
    carMake: "", carModel: "", carYear: "", lang: "en",
  });
  const [reference, setReference] = useState("");
  const [extras, setExtras] = useState(0);
  const [extraNames, setExtraNames] = useState<string[]>([]);
  const [mealChoices, setMealChoices] = useState<MealChoice[]>([
    { include: false, menu: "1" },
    { include: false, menu: "1" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const totalPeople = 2 + extras;
  const syncedMeals: MealChoice[] = Array.from({ length: totalPeople }, (_, i) =>
    mealChoices[i] ?? { include: false, menu: "1" }
  );
  const extraCost = extras * EXTRA_PRICE;
  const mealCost = syncedMeals.filter((m) => m.include).length * MEAL_PRICE;
  const total = BASE_PRICE + extraCost + mealCost;

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
      <div className="relative w-full max-w-2xl bg-[#1e3528] border border-white/15 rounded-2xl shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <div className="text-sage text-xs font-semibold tracking-[0.22em] uppercase mb-0.5">Admin Entry</div>
            <h2 className="font-heading text-white text-xl font-bold">Add Registration</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {submitError && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3 text-red-300 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" /> {submitError}
            </div>
          )}

          {/* Reference */}
          <section>
            <h3 className="text-white/70 text-xs font-semibold tracking-[0.2em] uppercase mb-3">Reference</h3>
            <div>
              <input
                type="text"
                placeholder="e.g. RIST-2026-XXXXXX"
                value={reference}
                onChange={(e) => {
                  setReference(e.target.value.toUpperCase());
                  setErrors((prev) => { const n = { ...prev }; delete n.reference; return n; });
                }}
                className={inputCls(errors.reference)}
              />
              {errors.reference && <p className="mt-1 text-red-400 text-xs">{errors.reference}</p>}
            </div>
          </section>

          {/* Team Info */}
          <section>
            <h3 className="text-white/70 text-xs font-semibold tracking-[0.2em] uppercase mb-3">Team Information</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: "driverName", label: "Driver Name", ph: "First & Last name" },
                { key: "copilotName", label: "Co-pilot Name", ph: "First & Last name" },
                { key: "email", label: "Email", ph: "email@example.com" },
                { key: "phone", label: "Phone", ph: "+352 xxx xxx xxx" },
              ].map(({ key, label, ph }) => (
                <div key={key}>
                  <label className="block text-white/60 text-xs font-medium mb-1">{label} <span className="text-red-400">*</span></label>
                  <input type={key === "email" ? "email" : "text"} placeholder={ph} value={(form as Record<string, string>)[key]}
                    onChange={(e) => setF(key, e.target.value)} className={inputCls(errors[key])} />
                  {errors[key] && <p className="mt-1 text-red-400 text-xs">{errors[key]}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* Vehicle */}
          <section>
            <h3 className="text-white/70 text-xs font-semibold tracking-[0.2em] uppercase mb-3">Vehicle</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: "carMake", label: "Make", ph: "e.g. Porsche" },
                { key: "carModel", label: "Model", ph: "e.g. 911" },
                { key: "carYear", label: "Year", ph: "e.g. 1987" },
              ].map(({ key, label, ph }) => (
                <div key={key}>
                  <label className="block text-white/60 text-xs font-medium mb-1">{label} <span className="text-red-400">*</span></label>
                  <input type="text" placeholder={ph} maxLength={key === "carYear" ? 4 : undefined}
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setF(key, key === "carYear" ? e.target.value.replace(/\D/g, "") : e.target.value)}
                    className={inputCls(errors[key])} />
                  {errors[key] && <p className="mt-1 text-red-400 text-xs">{errors[key]}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* Extra participants */}
          <section>
            <h3 className="text-white/70 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              Extra Participants <span className="text-white/40 font-normal normal-case">— €{EXTRA_PRICE}/person</span>
            </h3>
            <div className="flex items-center gap-4 mb-3">
              <button onClick={removeExtra} disabled={extras === 0}
                className="w-8 h-8 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors">
                <ChevronDown size={15} />
              </button>
              <span className="font-heading text-white text-xl font-bold w-5 text-center">{extras}</span>
              <button onClick={addExtra} disabled={extras >= 2}
                className="w-8 h-8 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors">
                <ChevronUp size={15} />
              </button>
            </div>
            {extraNames.map((name, i) => (
              <div key={i} className="mb-2">
                <label className="block text-white/60 text-xs font-medium mb-1">Extra {i + 1} Name <span className="text-red-400">*</span></label>
                <input type="text" placeholder="First & Last name" value={name}
                  onChange={(e) => setExtraNames((p) => p.map((n, idx) => (idx === i ? e.target.value : n)))}
                  className={inputCls(errors[`ex_${i}`])} />
                {errors[`ex_${i}`] && <p className="mt-1 text-red-400 text-xs">{errors[`ex_${i}`]}</p>}
              </div>
            ))}
          </section>

          {/* Meals */}
          <section>
            <h3 className="text-white/70 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              Meal Options <span className="text-white/40 font-normal normal-case">— €{MEAL_PRICE}/person</span>
            </h3>
            <div className="space-y-2">
              {syncedMeals.map((meal, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/70 text-sm">{participantLabel(i)}</span>
                    <button onClick={() => toggleMeal(i)}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${meal.include ? "bg-sage" : "bg-white/20"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${meal.include ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                  {meal.include && (
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      {["1", "2", "3"].map((m) => (
                        <button key={m} onClick={() => setMenu(i, m)}
                          className={`text-left px-2.5 py-2 rounded-lg border text-xs transition-colors duration-200 ${
                            meal.menu === m ? "bg-sage/20 border-sage text-white" : "bg-white/5 border-white/15 text-white/50 hover:border-white/30"
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
                <label className="block text-white/60 text-xs font-medium mb-1">Language</label>
                <select value={form.lang} onChange={(e) => setF("lang", e.target.value)}
                  className="w-full bg-white/8 border border-white/20 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sage/40">
                  <option value="lu">Luxembourgish</option>
                  <option value="fr">French</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-right">
                <div className="text-white/50 text-xs mb-0.5">Total</div>
                <div className="font-heading text-white text-2xl font-bold">€{total}</div>
              </div>
            </div>
          </section>
        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-white/20 text-white/70 text-sm hover:bg-white/10 transition-colors">
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

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
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
      <div className="relative w-full max-w-sm bg-[#1e3528] border border-white/15 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <div className="text-sage text-xs font-semibold tracking-[0.22em] uppercase mb-0.5">Account</div>
            <h2 className="font-heading text-white text-xl font-bold">Change Password</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-sage/20 flex items-center justify-center">
                <CheckCircle size={22} className="text-sage" />
              </div>
              <p className="text-white font-medium">Password updated successfully</p>
              <p className="text-white/40 text-sm">Closing…</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                  <AlertCircle size={15} className="flex-shrink-0" /> {error}
                </div>
              )}

              <div>
                <label className="block text-white/70 text-xs font-medium mb-1.5">New Password</label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className={inputCls()}
                    style={{ paddingLeft: "2.25rem", paddingRight: "2.5rem" }}
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= s ? strengthColor[s] : "bg-white/10"}`} />
                      ))}
                    </div>
                    <p className="text-white/40 text-xs">{strengthLabel[s]}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-white/70 text-xs font-medium mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                    placeholder="Repeat new password"
                    className={inputCls(confirmPassword.length > 0 && confirmPassword !== newPassword ? "mismatch" : undefined)}
                    style={{ paddingLeft: "2.25rem", paddingRight: "2.5rem" }}
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                  <p className="mt-1 text-red-400 text-xs">Passwords do not match</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-full border border-white/20 text-white/70 text-sm hover:bg-white/10 transition-colors">
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
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

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
  const totalMeals = regs.reduce((s, r) => s + r.mealChoices.filter((m) => m.include).length, 0);

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
    <div className="min-h-screen bg-[#1a2e24]">
      {/* Top navbar */}
      <header className="bg-[#152619] border-b border-white/8 px-6 lg:px-10 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Image src="/rally-logo.png" alt="RIST 2026" width={1184} height={621} className="h-8 w-auto" />
          <div className="hidden sm:block h-5 w-px bg-white/20" />
          <span className="hidden sm:block text-white/50 text-xs tracking-[0.2em] uppercase">Staff Portal</span>
        </div>
        <div className="flex items-center gap-3">
          {/* User badge with dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-2 bg-sage/10 border border-sage/20 rounded-full px-3 py-1.5 hover:bg-sage/15 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-sage/30 flex items-center justify-center text-sage text-[10px] font-bold">
                {username[0]?.toUpperCase()}
              </div>
              <span className="text-sage text-xs font-medium">{username}</span>
              <ChevronDown size={11} className={`text-sage/60 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`} />
            </button>
            {showUserMenu && (
              <>
                {/* backdrop to close on outside click */}
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-44 bg-[#1e3528] border border-white/15 rounded-xl shadow-2xl overflow-hidden z-20">
                  <button
                    onClick={() => { setShowChangePassword(true); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-white/70 text-sm hover:bg-white/8 hover:text-white transition-colors"
                  >
                    <KeyRound size={14} className="text-sage/70" />
                    Change Password
                  </button>
                  <div className="border-t border-white/8" />
                  <button
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-white/50 text-sm hover:bg-white/8 hover:text-white/80 transition-colors disabled:opacity-40"
                  >
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
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Users size={18} className="text-sage" />, value: regs.length, label: "Registrations", sub: "out of 60" },
            { icon: <Euro size={18} className="text-sage" />, value: `€${totalRevenue}`, label: "Total Revenue", sub: "collected" },
            { icon: <UtensilsCrossed size={18} className="text-sage" />, value: totalMeals, label: "Meals Ordered", sub: "total covers" },
          ].map(({ icon, value, label, sub }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 mb-2">{icon}</div>
              <div className="font-heading text-white text-2xl font-bold leading-none">{value}</div>
              <div className="text-white/60 text-xs mt-1">{label}</div>
              <div className="text-white/30 text-xs">{sub}</div>
            </div>
          ))}
        </div>

        {/* Table header */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="font-heading text-white text-xl font-bold">Registrations</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh list"
              className="w-9 h-9 rounded-full border border-white/20 text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center disabled:opacity-40 transition-colors duration-200"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-sage text-forest font-semibold text-sm hover:bg-sage-light active:scale-[0.98] transition-[background-color,transform] duration-200 shadow-[0_4px_16px_rgba(82,183,136,0.3)]"
            >
              <Plus size={15} /> Add Registration
            </button>
          </div>
        </div>

        {/* Table */}
        {regs.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-16 text-center">
            <Users size={36} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No registrations yet.</p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    {["Reference", "Date", "Driver / Co-pilot", "Email", "Car", "Extras", "Meals", "Total", "Lang", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-white/50 text-xs font-semibold tracking-[0.12em] uppercase whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {regs.map((r) => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-sage text-xs whitespace-nowrap">{r.reference}</td>
                      <td className="px-4 py-3.5 text-white/50 text-xs whitespace-nowrap">{formatDate(r.submittedAt)}</td>
                      <td className="px-4 py-3.5">
                        <div className="text-white text-xs font-medium">{r.driverName}</div>
                        <div className="text-white/50 text-xs">{r.copilotName}</div>
                        {r.extraNames.map((n) => (
                          <div key={n} className="text-white/40 text-xs">+{n}</div>
                        ))}
                      </td>
                      <td className="px-4 py-3.5">
                        <a href={`mailto:${r.email}`} className="text-white/60 text-xs hover:text-sage transition-colors">{r.email}</a>
                        <div className="text-white/30 text-xs mt-0.5">{r.phone}</div>
                      </td>
                      <td className="px-4 py-3.5 text-white/70 text-xs whitespace-nowrap">
                        {r.carMake} {r.carModel}
                        <div className="text-white/30 text-xs">{r.carYear}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.extraParticipants > 0 ? "bg-sage/15 text-sage" : "text-white/30"
                        }`}>
                          {r.extraParticipants > 0 ? `+${r.extraParticipants}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {r.mealChoices.filter((m) => m.include).length > 0 ? (
                          <div className="space-y-0.5">
                            {r.mealChoices.map((m, i) => m.include && (
                              <div key={i} className="text-white/60 text-xs whitespace-nowrap">
                                {i === 0 ? r.driverName : i === 1 ? r.copilotName : r.extraNames[i - 2] || `P${i + 1}`}: M{m.menu}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-white/25 text-xs">No meals</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-heading text-white font-bold whitespace-nowrap">€{r.total}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block bg-white/8 text-white/50 text-xs font-medium px-2 py-0.5 rounded">
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
      </main>

      {/* Change password modal */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {/* Add modal */}
      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onAdd={(r) => setRegs((p) => [r, ...p])}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#1e3528] border border-white/15 rounded-2xl p-7 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h3 className="font-heading text-white text-lg font-bold mb-2">Delete Registration?</h3>
            <p className="text-white/50 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-full border border-white/20 text-white/70 text-sm hover:bg-white/10 transition-colors">
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
