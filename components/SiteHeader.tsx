"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/cn";
import { site } from "@/lib/site";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";

const nav = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/sample-work", label: "Sample Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_75%,transparent)] backdrop-blur">
      <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative grid h-16 w-[220px] place-items-start sm:w-[280px] lg:w-[320px]">
            <Image
              src="/bookedloop.png"
              alt={`${site.name} logo`}
              fill
              priority
              sizes="(max-width: 640px) 220px, (max-width: 1024px) 280px, 320px"
              className="object-contain object-left scale-[1.25] sm:scale-[1.45]"
            />
          </span>
          <span className="sr-only">{site.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm text-[color-mix(in_srgb,var(--foreground)_78%,transparent)] transition-colors hover:text-[var(--foreground)]",
                  active &&
                    "bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] text-[var(--foreground)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button href={site.ctas.primary.href} size="sm">
            {site.ctas.primary.label}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid size-11 place-items-center rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_80%,transparent)] text-[var(--foreground)] md:hidden"
          aria-label="Open menu"
          aria-expanded={open}
        >
          <span className="sr-only">Open menu</span>
          <div className="flex flex-col gap-1.5">
            <span className={cn("h-0.5 w-5 bg-current transition", open && "translate-y-2 rotate-45")} />
            <span className={cn("h-0.5 w-5 bg-current transition", open && "opacity-0")} />
            <span className={cn("h-0.5 w-5 bg-current transition", open && "-translate-y-2 -rotate-45")} />
          </div>
        </button>
      </div>

      {open ? (
        <div className="border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] md:hidden">
          <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
            <div className="grid gap-2">
              <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] px-4 py-3">
                <div className="text-sm font-medium">Theme</div>
                <ThemeToggle />
              </div>
              {nav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] px-4 py-3 text-sm text-[var(--foreground)]",
                      active && "border-[color-mix(in_srgb,var(--accent-2)_45%,transparent)]"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Button href={site.ctas.primary.href} className="w-full">
                {site.ctas.primary.label}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
