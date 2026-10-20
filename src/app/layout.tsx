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
  title: "Rotary Indian Summer Rally Archive | Luxembourg",
  description:
    "Explore the 9th Rotary Indian Summer Rally photo gallery and archive past editions from the Rotary Club Bascharage-Kordall.",
  openGraph: {
    title: "9th Rotary Indian Summer Rally Archive",
    description:
      "Photos and memories from the Rotary Club Bascharage-Kordall's 9th charity rally.",
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
