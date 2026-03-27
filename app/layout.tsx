import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AdminAwareShell } from "@/components/AdminAwareShell";
import { MotionProvider } from "@/components/motion";
import { ToastProvider } from "@/components/ui/Toast";
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
    canonical: site.url,
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — Turn missed leads into booked clients`,
    description: site.description,
    url: site.url,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${site.name} — Turn missed leads into booked clients`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Turn missed leads into booked clients`,
    description: site.description,
    images: ["/opengraph-image"],
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
          <ToastProvider>
            <AdminAwareShell>{children}</AdminAwareShell>
          </ToastProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
