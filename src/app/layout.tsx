import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rotary Indian Summer Rally 2026 | Luxembourg",
  description:
    "Join the Rotary Indian Summer Rally 2026 — a curated classic car journey through the golden autumn landscapes of Luxembourg and the Moselle Valley. 6 September 2026, start 10h00, briefing 10h45.",
  openGraph: {
    title: "Rotary Indian Summer Rally 2026",
    description:
      "A classic car rally through Luxembourg's autumn splendour. 6 September 2026.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-off-white">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
