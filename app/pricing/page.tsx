import type { Metadata } from "next";

import { FadeUp, Stagger } from "@/components/AnimateIn";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { pricing } from "@/lib/content/pricing";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "BookedLoop pricing for local service businesses. Clear starting points, optional support, and custom bundles available.",
};

export default function PricingPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_12%_0%,color-mix(in_srgb,var(--accent-2)_22%,transparent),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(44rem_28rem_at_90%_20%,color-mix(in_srgb,var(--accent)_18%,transparent),transparent_70%)]" />
        <Container className="relative py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
            <div className="space-y-5">
              <FadeUp>
                <Badge className="w-fit">Pricing</Badge>
              </FadeUp>
              <FadeUp delay={0.05}>
                <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
                  Clear packages.{" "}
                  <span className="bg-[linear-gradient(90deg,var(--accent-2),var(--accent))] bg-clip-text text-transparent">
                    Custom bundles
                  </span>{" "}
                  when it makes sense.
                </h1>
              </FadeUp>
              <FadeUp delay={0.08}>
                <p className="max-w-xl text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] sm:text-lg sm:leading-8">
                  Clear starting points with optional support where it makes sense. Custom bundles are available for multi-location businesses or combined needs.
                </p>
              </FadeUp>
              <FadeUp delay={0.1}>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button href={site.ctas.primary.href} size="lg">
                    {site.ctas.primary.label} <ArrowRightIcon className="size-5" />
                  </Button>
                  <Button href="/services" variant="secondary" size="lg">
                    View services
                  </Button>
                </div>
              </FadeUp>
            </div>

            <FadeUp delay={0.1} className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] p-6">
              <div className="text-sm font-semibold tracking-tight">Note</div>
              <p className="mt-2 text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                {pricing.note}
              </p>
            </FadeUp>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <Stagger className="grid gap-5 lg:grid-cols-3">
            {pricing.packages.map((pkg) => (
              <FadeUp key={pkg.id}>
                <Card
                  className={cn(
                    "h-full",
                    pkg.recommended
                      ? "border-[color-mix(in_srgb,var(--accent-2)_55%,transparent)] bg-[color-mix(in_srgb,var(--card)_92%,transparent)]"
                      : "bg-[color-mix(in_srgb,var(--card)_88%,transparent)]"
                  )}
                >
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-lg font-semibold tracking-tight">{pkg.name}</div>
                      {pkg.recommended ? (
                        <Badge className="border-[color-mix(in_srgb,var(--accent-2)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent-2)_14%,transparent)]">
                          Recommended
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-end justify-between gap-4">
                      <div className="text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                        {pkg.label}
                      </div>
                      <div className="text-xl font-semibold tracking-tight">{pkg.priceLines[0]}</div>
                    </div>
                    {pkg.priceLines.length > 1 ? (
                      <div className="grid gap-1 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                        {pkg.priceLines.slice(1).map((line) => (
                          <div key={line}>{line}</div>
                        ))}
                      </div>
                    ) : null}
                    <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                      {pkg.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ul className="grid gap-2 text-sm text-[color-mix(in_srgb,var(--foreground)_75%,transparent)]">
                      {pkg.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-3">
                          <CheckIcon className="mt-0.5 size-5 text-[color-mix(in_srgb,var(--accent-2)_85%,var(--accent)_15%)]" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="grid gap-2">
                      <Button href={site.ctas.primary.href} className="w-full">
                        Book a Free Audit
                      </Button>
                      <Button href="/contact?intent=pricing" variant="secondary" className="w-full">
                        Ask about this package
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </FadeUp>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section className="bg-[color-mix(in_srgb,var(--background)_92%,transparent)]">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight">DIY vs BookedLoop</h2>
              <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                If you enjoy building systems, DIY can work. Most owners just want it done correctly and kept clean.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] p-6">
                <div className="text-sm font-semibold tracking-tight">DIY</div>
                <ul className="mt-4 grid gap-2 text-sm text-[color-mix(in_srgb,var(--foreground)_72%,transparent)]">
                  {[
                    "You assemble tools and templates",
                    "Progress depends on time and consistency",
                    "Hard to know what matters most",
                    "Follow-up often becomes manual again",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[color-mix(in_srgb,var(--foreground)_45%,transparent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-[color-mix(in_srgb,var(--accent-2)_40%,transparent)] bg-[color-mix(in_srgb,var(--card)_82%,transparent)] p-6">
                <div className="text-sm font-semibold tracking-tight">BookedLoop</div>
                <ul className="mt-4 grid gap-2 text-sm text-[color-mix(in_srgb,var(--foreground)_75%,transparent)]">
                  {[
                    "Clear priorities and fast execution",
                    "Booking-first page structure",
                    "Review and follow-up systems that run",
                    "Ongoing support when you need it",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckIcon className="mt-0.5 size-5 text-[var(--accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Card className="overflow-hidden">
            <div className="bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-2)_22%,transparent),transparent_55%,color-mix(in_srgb,var(--accent)_18%,transparent))] p-8 sm:p-10">
              <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold tracking-tight">Not sure what you need?</h2>
                  <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                    Start with a Free Audit. You’ll get a clear plan and we’ll recommend the simplest package that fixes the biggest leak first.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button href={site.ctas.primary.href} size="lg">
                    {site.ctas.primary.label} <ArrowRightIcon className="size-5" />
                  </Button>
                  <Button href="/contact" variant="secondary" size="lg">
                    Contact BookedLoop
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </Container>
      </Section>
    </div>
  );
}
