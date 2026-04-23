import Link from "next/link";

export default function Footer() {
  return (
    <footer id="contact" className="bg-[#1a2e24] text-white">
      {/* Top strip */}
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
            <p className="text-white/55 text-sm leading-[1.8] max-w-xs">
              An annual classic car rally through Luxembourg&apos;s golden autumn
              landscapes, organised by Rotary Club Bascharage-Kordall in support of local
              and international charitable causes.
            </p>

            {/* Rotary wheel SVG */}
            <div className="mt-6 flex items-center gap-3">
              <svg
                viewBox="0 0 50 50"
                className="w-8 h-8 text-sage opacity-60"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="25" cy="25" r="22" />
                <circle cx="25" cy="25" r="8" />
                {Array.from({ length: 6 }).map((_, i) => {
                  const angle = (i * 60 * Math.PI) / 180;
                  const x1 = 25 + 8 * Math.cos(angle);
                  const y1 = 25 + 8 * Math.sin(angle);
                  const x2 = 25 + 22 * Math.cos(angle);
                  const y2 = 25 + 22 * Math.sin(angle);
                  return (
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
                  );
                })}
              </svg>
              <span className="text-white/40 text-xs tracking-wide">
                Service Above Self
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white/80 text-xs font-semibold tracking-[0.22em] uppercase mb-5">
              Navigation
            </h4>
            <ul className="space-y-3">
              {["About", "Route", "Gallery", "Register"].map((item) => (
                <li key={item}>
                  <Link
                    href={`#${item.toLowerCase()}`}
                    className="text-white/50 text-sm hover:text-sage transition-colors duration-200 focus-visible:outline-none focus-visible:text-sage"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white/80 text-xs font-semibold tracking-[0.22em] uppercase mb-5">
              Contact
            </h4>
            <ul className="space-y-3 text-white/50 text-sm">
              <li>
                <a
                  href="mailto:rist2026@hotmail.com"
                  className="hover:text-sage transition-colors duration-200 focus-visible:outline-none focus-visible:text-sage"
                >
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

      {/* Bottom strip */}
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-xs">
            © 2026 Rotary Club Bascharage-Kordall — Indian Summer Rally. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-white/30 text-xs hover:text-sage/70 transition-colors focus-visible:outline-none"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-white/30 text-xs hover:text-sage/70 transition-colors focus-visible:outline-none"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
