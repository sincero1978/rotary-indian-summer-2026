"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, AlertCircle, CheckCircle, Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send email"); return; }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            src="/rally-logo.jpg"
            alt="Rotary Indian Summer Tour 2026"
            width={1184}
            height={621}
            className="w-44 h-auto mx-auto mb-7 drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          />
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center">
              <Mail size={15} className="text-sage" />
            </div>
            <h1 className="font-heading text-white text-lg font-bold tracking-tight">Forgot Password</h1>
          </div>
          <p className="text-white/45 text-xs tracking-wide">Enter your email to receive a reset link</p>
        </div>

        {sent ? (
          <div className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl p-7 text-center">
            <div className="w-12 h-12 rounded-full bg-sage/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={22} className="text-sage" />
            </div>
            <h2 className="font-heading text-white text-lg font-bold mb-2">Email Sent</h2>
            <p className="text-white/55 text-sm leading-relaxed mb-6">
              If that email is registered, a password reset link has been sent. Check your inbox — the link expires in 1 hour.
            </p>
            <Link href="/admin/login"
              className="inline-flex items-center gap-2 text-sage text-sm hover:text-sage-light transition-colors">
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl p-7 space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="block text-white/70 text-sm font-medium mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
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
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Sending…</>
              ) : (
                "Send Reset Link"
              )}
            </button>

            <div className="text-center pt-1">
              <Link href="/admin/login"
                className="inline-flex items-center gap-1.5 text-white/40 text-xs hover:text-white/70 transition-colors">
                <ArrowLeft size={12} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
