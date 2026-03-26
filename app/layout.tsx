import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { MobileStickyCta } from "@/components/MobileStickyCta";
import { MotionProvider } from "@/components/motion";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Turn missed leads into booked clients`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  keywords: [
    "BookedLoop",
    "local service business marketing",
    "bookings",
    "review automation",
    "google business profile",
    "local SEO",
    "website design",
    "lead follow-up",
    "CRM setup",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — Turn missed leads into booked clients`,
    description: site.description,
    url: "/",
    images: [
      {
        url: "/bookedloop.png",
        width: 1024,
        height: 1024,
        alt: `${site.name} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Turn missed leads into booked clients`,
    description: site.description,
    images: ["/bookedloop.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.name,
      url: site.url,
      logo: `${site.url}/bookedloop.png`,
      description: site.description,
      areaServed: "US",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: site.url,
    },
  ];

  return (
    <html
      lang="en"
      data-theme="light"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <MotionProvider>
          <div className="min-h-full flex flex-col">
            <SiteHeader />
            <main className="flex-1 pb-24 md:pb-0">{children}</main>
            <SiteFooter />
            <MobileStickyCta />
          </div>
        </MotionProvider>
      </body>
    </html>
  );
}
