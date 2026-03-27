import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { site } from "@/lib/site";

const footerNav = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/sample-work", label: "Sample Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)]">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-[220px] sm:w-[320px]">
                <Image
                  src="/bookedloop.png"
                  alt={`${site.name} logo`}
                  fill
                  sizes="(max-width: 640px) 220px, 320px"
                  className="object-contain object-left scale-[1.25] sm:scale-[1.45]"
                />
              </div>
              <span className="sr-only">{site.name}</span>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
              {site.tagline}
            </p>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Navigation</div>
            <div className="grid gap-1 text-sm">
              {footerNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] hover:text-[var(--foreground)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Contact</div>
            <div className="grid gap-1 text-sm text-[color-mix(in_srgb,var(--foreground)_72%,transparent)]">
              <a className="hover:text-[var(--foreground)]" href={`mailto:${site.contact.email}`}>
                {site.contact.email}
              </a>
              {site.contact.phone ? (
                <a className="hover:text-[var(--foreground)]" href={`tel:${site.contact.phone}`}>
                  {site.contact.phone}
                </a>
              ) : null}
              <div className="pt-2 text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
                Social links: add your URLs in lib/site.ts
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-[var(--border)] pt-6 text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
