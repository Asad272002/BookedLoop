"use client";

import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { site } from "@/lib/site";

export function MobileStickyCta() {
  const pathname = usePathname();

  if (pathname === "/contact") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] p-3 backdrop-blur md:hidden">
      <Button href={site.ctas.primary.href} className="w-full">
        {site.ctas.primary.label}
      </Button>
    </div>
  );
}
