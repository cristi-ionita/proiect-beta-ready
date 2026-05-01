import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import { I18nProvider } from "@/lib/i18n/i18n-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Cars Management",
    template: "%s | Cars Management",
  },
  description:
    "Modern fleet, employees, maintenance and operations management system.",
  applicationName: "Cars Management",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-slate-950 scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-slate-950 font-sans text-slate-50">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}