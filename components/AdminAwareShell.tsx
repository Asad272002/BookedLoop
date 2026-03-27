"use client";

import { usePathname } from "next/navigation";
import * as React from "react";

import { MobileStickyCta } from "@/components/MobileStickyCta";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export function AdminAwareShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <main className="min-h-full">{children}</main>;
  }

  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 md:pb-0">{children}</main>
      <SiteFooter />
      <MobileStickyCta />
    </div>
  );
}

