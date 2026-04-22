"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Route", href: "#route" },
  { label: "Gallery", href: "#gallery" },
  { label: "Register", href: "#register" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,padding,box-shadow] duration-500 ${
        scrolled
          ? "bg-forest shadow-[0_4px_24px_rgba(45,106,79,0.18)] py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between">
        {/* Logo */}
        <Link href="#" className="flex items-center group">
          <Image
            src="/rc-bascharage-kordall.webp"
            alt="Rotary Club Bascharage-Kordall"
            width={240}
            height={90}
            className="h-24 w-auto object-contain mix-blend-screen opacity-95 transition-opacity duration-200 group-hover:opacity-100"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-white/80 tracking-wide hover:text-sage transition-colors duration-200 focus-visible:outline-none focus-visible:text-sage"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="#register"
            className="ml-4 px-5 py-2 rounded-full text-sm font-semibold bg-sage text-forest hover:bg-sage-light active:scale-95 transition-[background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage"
          >
            Register Now
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="bg-forest/98 px-6 pb-6 pt-2 flex flex-col gap-4 border-t border-white/10">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-white/80 text-base font-medium hover:text-sage transition-colors py-1"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="#register"
            onClick={() => setMenuOpen(false)}
            className="mt-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-sage text-forest text-center hover:bg-sage-light transition-colors"
          >
            Register Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
