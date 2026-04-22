import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  const ref = searchParams.ref ?? "";

  return (
    <main className="min-h-screen bg-off-white flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="Rotary Indian Summer Tour 2026"
            width={280}
            height={112}
            className="h-24 w-auto object-contain mx-auto"
          />
        </div>

        <div className="w-16 h-16 rounded-full bg-sage/15 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={36} className="text-forest" />
        </div>

        <h1 className="font-heading text-forest text-4xl font-bold tracking-tight mb-3">
          Registration Confirmed!
        </h1>
        <p className="text-warm-gray text-lg leading-relaxed mb-8">
          Thank you for registering for the Rotary Indian Summer Tour 2026.
          A confirmation email has been sent to the organising team.
        </p>

        {ref && (
          <div className="bg-pale-sage border border-border rounded-xl px-6 py-5 mb-8">
            <p className="text-forest/60 text-xs font-semibold tracking-[0.2em] uppercase mb-1">
              Your Reference Number
            </p>
            <p className="font-heading text-forest text-2xl font-bold">{ref}</p>
            <p className="text-warm-gray text-sm mt-1">
              Please keep this reference for your records.
            </p>
          </div>
        )}

        <div className="bg-white border border-border rounded-xl px-6 py-5 mb-8 text-left space-y-2 text-sm text-warm-gray">
          <div className="flex items-center gap-2">
            <span className="text-sage">📅</span> Sunday, 6 September 2026
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sage">⏰</span> Start 10h00 — Briefing 10h45
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sage">📍</span> Mess-Café / Reckange-sur-Mess
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sage">🗺</span> Route book with arrows provided on the day
          </div>
        </div>

        <Link
          href="/"
          className="inline-block px-8 py-3 rounded-full bg-forest text-white font-semibold text-sm hover:bg-forest-dark transition-[background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
