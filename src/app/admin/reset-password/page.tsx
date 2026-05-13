"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, AlertCircle, CheckCircle, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl p-7 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={22} className="text-red-400" />
        </div>
        <h2 className="font-heading text-white text-lg font-bold mb-2">Invalid Link</h2>
        <p className="text-white/55 text-sm mb-6">This reset link is missing or malformed.</p>
        <Link href="/admin/forgot-password" className="text-sage text-sm hover:text-sage-light transition-colors">
          Request a new link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to reset password"); return; }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl p-7 text-center">
        <div className="w-12 h-12 rounded-full bg-sage/15 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={22} className="text-sage" />
        </div>
        <h2 className="font-heading text-white text-lg font-bold mb-2">Password Updated</h2>
        <p className="text-white/55 text-sm leading-relaxed mb-6">
          Your password has been changed. You can now sign in with your new credentials.
        </p>
        <Link href="/admin/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-sage text-forest font-semibold text-sm hover:bg-sage-light transition-colors shadow-[0_4px_16px_rgba(82,183,136,0.3)]">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl p-7 space-y-5">
      {error && (
        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3 text-red-300 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" /> {error}
        </div>
      )}

      <div>
        <label className="block text-white/70 text-sm font-medium mb-1.5">New Password</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Min. 8 characters"
            required
            className="w-full bg-white/8 border border-white/20 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage/60 transition-[border-color,box-shadow] duration-200 text-sm"
          />
          <button type="button" onClick={() => setShow((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <p className="text-white/30 text-xs mt-1">Minimum 8 characters</p>
      </div>

      <div>
        <label className="block text-white/70 text-sm font-medium mb-1.5">Confirm Password</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(""); }}
            placeholder="Repeat password"
            required
            className="w-full bg-white/8 border border-white/20 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage/60 transition-[border-color,box-shadow] duration-200 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-full bg-sage text-forest font-semibold text-sm hover:bg-sage-light active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-[background-color,transform,opacity] duration-200 shadow-[0_8px_32px_rgba(82,183,136,0.3)] flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 size={15} className="animate-spin" /> Updating…</> : "Set New Password"}
      </button>

      <div className="text-center pt-1">
        <Link href="/admin/login"
          className="inline-flex items-center gap-1.5 text-white/40 text-xs hover:text-white/70 transition-colors">
          <ArrowLeft size={12} /> Back to Sign In
        </Link>
      </div>
    </form>
  );
}

export default function ResetPassword() {
  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <div className="absolute inset-0">
        <Image src="/moselle-tour.avif" alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-br from-forest/96 via-forest/90 to-[#1a2e24]/97" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            backgroundSize: "256px 256px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <Image
            src="/rally-logo-v2.png"
            alt="Rotary Indian Summer Tour 2026"
            width={1184}
            height={621}
            className="w-44 h-auto mx-auto mb-7 drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          />
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center">
              <Lock size={15} className="text-sage" />
            </div>
            <h1 className="font-heading text-white text-lg font-bold tracking-tight">Set New Password</h1>
          </div>
          <p className="text-white/45 text-xs tracking-wide">Choose a strong password for the Staff Portal</p>
        </div>

        <Suspense fallback={<div className="text-white/40 text-sm text-center">Loading…</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
