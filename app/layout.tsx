import "./globals.css";
import { DotPatternBg } from "@/components/dot-pattern-bg";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from "@/lib/context/app-context";
import { AuthProvider } from "@/lib/context/auth-context";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { headers } from "next/headers";
import type React from "react";

const inter = Inter({ subsets: ["latin"], fallback: ["Poppins, sans-serif"] });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});

const sharedTitle =
  "newhorizn – calm for guests. control for hosts | accommodation rentals & more";
const sharedDescription =
  "The open marketplace for guests and hosts. Weekend getaway or semester rental? List your property or book in seconds. We handle booking to payouts.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.newhorizn.com"),
  title: {
    template: "%s - newhorizn",
    default: "newhorizn - calm for guests. control for hosts.",
  },
  description: "Accommodation rentals, hotels, beach houses, studios, & more",
  alternates: {
    canonical: "/",
  },
  applicationName: "newhorizn",
  authors: [{ name: "newhorizn team" }],
  generator: "Next.js",
  keywords: [
    "hotel management software",
    "hostel property management",
    "apartment rental software",
    "accommodation property management for owners",
    "guest house booking engine",
    "property management system",
    "vacation rental software",
    "boutique hotel management",
    "accommodation software",
    "accommodation",
    "rentals",
    "hotels",
    "beach houses",
    "studios",
    "property management",
  ],
  referrer: "origin-when-cross-origin",
  creator: "newhorizn",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: sharedTitle,
    description: sharedDescription,
    url: "/",
    siteName: "newhorizn",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph.jpg",
        width: 1200,
        height: 630,
        alt: "newhorizn - accommodation rentals for guests and hosts",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: sharedTitle,
    description: sharedDescription,
    images: ["/opengraph.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  const themeScript = `(function(){try{var k="app-theme",s=localStorage.getItem(k),d="dark",l="light",cl=document.documentElement.classList;cl.remove(d,l);if(s===d||s===l)cl.add(s);else cl.add(window.matchMedia("(prefers-color-scheme: dark)").matches?d:l)}catch(e){}})();`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "newhorizn",
    url: "https://www.newhorizn.com",
    description:
      "Premium property management software for owners of hotels, hostels, and apartments.",
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <DotPatternBg />
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <AppProvider>{children}</AppProvider>
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
