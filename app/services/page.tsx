import type { Metadata } from "next";

import { FadeUp, Stagger } from "@/components/AnimateIn";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { services } from "@/lib/content/services";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "BookedLoop services and pricing for local service businesses: website setup, booking add-ons, review automation, social management, lead follow-up, Google profile optimization, and local SEO.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((svc, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: svc.name,
        description: svc.description,
        provider: {
          "@type": "Organization",
          name: site.name,
          url: site.url,
        },
        areaServed: "US",
        url: `${site.url}${svc.href}`,
      },
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_10%_0%,color-mix(in_srgb,var(--accent-2)_22%,transparent),transparent_70%)]" />
        <Container className="relative py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
            <div className="space-y-5">
              <FadeUp>
                <Badge className="w-fit">Services</Badge>
              </FadeUp>
              <FadeUp delay={0.05}>
                <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
                  Practical packages that lead to{" "}
                  <span className="bg-[linear-gradient(90deg,var(--accent-2),var(--accent))] bg-clip-text text-transparent">
                    more bookings
                  </span>
                  .
                </h1>
              </FadeUp>
              <FadeUp delay={0.08}>
                <p className="max-w-xl text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] sm:text-lg sm:leading-8">
                  Choose one service or build a bundle. Everything is designed to make it easier for customers to trust you and book—without adding busywork.
                </p>
              </FadeUp>
              <FadeUp delay={0.1}>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button href={site.ctas.primary.href} size="lg">
                    {site.ctas.primary.label} <ArrowRightIcon className="size-5" />
                  </Button>
                  <Button href="/pricing" variant="secondary" size="lg">
                    View packages
                  </Button>
                </div>
              </FadeUp>
            </div>

            <FadeUp delay={0.1} className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] p-6">
              <div className="text-sm font-semibold tracking-tight">Good fit if you want:</div>
              <ul className="mt-4 grid gap-2 text-sm text-[color-mix(in_srgb,var(--foreground)_75%,transparent)]">
                {[
                  "A cleaner website that actually converts",
                  "An obvious booking path (not hidden in the menu)",
                  "More reviews without chasing customers",
                  "Faster replies and better follow-up",
                  "Local visibility support that’s practical",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckIcon className="mt-0.5 size-5 text-[var(--accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </FadeUp>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <Stagger className="grid gap-6">
            {services.map((svc) => (
              <FadeUp key={svc.id}>
                <Card id={svc.id} className="scroll-mt-24 overflow-hidden">
                  <div className="bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-2)_18%,transparent),transparent_60%,color-mix(in_srgb,var(--accent)_14%,transparent))]">
                    <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-3 lg:items-start">
                      <div className="space-y-3 lg:col-span-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="w-fit">{svc.name}</Badge>
                          {svc.badge ? (
                            <Badge className="border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
                              {svc.badge}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="text-xl font-semibold tracking-tight">
                          {svc.short}
                        </div>
                        <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_72%,transparent)]">
                          {svc.description}
                        </p>
                        <div className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                          <span className="font-semibold text-[var(--foreground)]">Ideal outcome:</span>{" "}
                          {svc.outcome}
                        </div>
                        <div className="pt-2">
                          <Button href={site.ctas.primary.href} size="sm">
                            Book a Free Audit
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-6 lg:col-span-2 lg:grid-cols-2">
                        <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] p-6">
                          <div className="text-sm font-semibold tracking-tight">Who it’s for</div>
                          <p className="mt-2 text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                            {svc.whoFor}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] p-6">
                          <div className="text-sm font-semibold tracking-tight">Pricing</div>
                          <div className="mt-3 grid gap-1 text-sm text-[color-mix(in_srgb,var(--foreground)_75%,transparent)]">
                            {svc.pricingLines.map((line) => (
                              <div key={line}>{line}</div>
                            ))}
                          </div>
                          {svc.pricingNote ? (
                            <div className="mt-3 text-xs leading-5 text-[color-mix(in_srgb,var(--foreground)_62%,transparent)]">
                              {svc.pricingNote}
                            </div>
                          ) : null}
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] p-6 lg:col-span-2">
                          <div className="text-sm font-semibold tracking-tight">What’s included</div>
                          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                            {svc.included.map((item) => (
                              <li
                                key={item}
                                className="flex items-start gap-3 text-sm text-[color-mix(in_srgb,var(--foreground)_75%,transparent)]"
                              >
                                <CheckIcon className="mt-0.5 size-5 text-[color-mix(in_srgb,var(--accent-2)_85%,var(--accent)_15%)]" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardHeader className="hidden" />
                  <CardContent className="hidden" />
                </Card>
              </FadeUp>
            ))}
          </Stagger>
        </Container>
      </Section>
    </div>
  );
}
