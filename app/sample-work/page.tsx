import type { Metadata } from "next";

import { FadeUp, Stagger } from "@/components/AnimateIn";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { sampleWork } from "@/lib/content/sampleWork";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sample Work",
  description:
    "Honest demo case studies and example workflows that show how BookedLoop improves booking flow, reviews, and follow-up systems for local service businesses.",
  alternates: { canonical: "/sample-work" },
};

export default function SampleWorkPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_10%_0%,color-mix(in_srgb,var(--accent-2)_22%,transparent),transparent_70%)]" />
        <Container className="relative py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
            <div className="space-y-5">
              <FadeUp>
                <Badge className="w-fit">Sample Work</Badge>
              </FadeUp>
              <FadeUp delay={0.05}>
                <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
                  Realistic examples you can{" "}
                  <span className="bg-[linear-gradient(90deg,var(--accent-2),var(--accent))] bg-clip-text text-transparent">
                    replace later
                  </span>
                  .
                </h1>
              </FadeUp>
              <FadeUp delay={0.08}>
                <p className="max-w-xl text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] sm:text-lg sm:leading-8">
                  No fake testimonials, no made-up results. These are demo concepts and example workflows showing the kind of clean, booking-first work BookedLoop delivers.
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
              <div className="text-sm font-semibold tracking-tight">How to use this page</div>
              <ul className="mt-4 grid gap-2 text-sm text-[color-mix(in_srgb,var(--foreground)_72%,transparent)]">
                {[
                  "Keep these examples as placeholders until you have real projects",
                  "Swap labels and content with real client work when available",
                  "Add real screenshots only once you have permission",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckIcon className="mt-0.5 size-5 text-[color-mix(in_srgb,var(--accent-2)_85%,var(--accent)_15%)]" />
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
          <Stagger className="grid gap-5 md:grid-cols-3">
            {sampleWork.map((item) => (
              <FadeUp key={item.id}>
                <Card className="h-full bg-[color-mix(in_srgb,var(--card)_88%,transparent)]">
                  <CardHeader className="space-y-2">
                    <Badge className="w-fit">{item.label}</Badge>
                    <div className="text-lg font-semibold tracking-tight">{item.title}</div>
                    <div className="text-sm text-[color-mix(in_srgb,var(--foreground)_62%,transparent)]">
                      {item.industry}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                      {item.overview}
                    </p>
                    <div className="space-y-2">
                      <div className="text-sm font-semibold tracking-tight">What we built</div>
                      <ul className="grid gap-2 text-sm text-[color-mix(in_srgb,var(--foreground)_75%,transparent)]">
                        {item.whatWeBuilt.map((w) => (
                          <li key={w} className="flex items-start gap-3">
                            <CheckIcon className="mt-0.5 size-5 text-[var(--accent)]" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {item.disclaimer ? (
                      <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] p-3 text-xs leading-5 text-[color-mix(in_srgb,var(--foreground)_60%,transparent)]">
                        {item.disclaimer}
                      </div>
                    ) : null}
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
              <h2 className="text-3xl font-semibold tracking-tight">Before / after examples (demo)</h2>
              <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                These are common patterns we see in local businesses. Use these as “before/after” placeholders until you can show real screenshots.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  title: "Before",
                  items: [
                    "Services buried and unclear",
                    "No obvious booking CTA",
                    "Slow pages on mobile",
                    "Inconsistent reviews and follow-up",
                  ],
                },
                {
                  title: "After",
                  items: [
                    "Clear services and pricing ranges (optional)",
                    "Booking CTA above the fold + repeated",
                    "Fast, readable mobile layout",
                    "Review + reminder workflow in place",
                  ],
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] p-6"
                >
                  <div className="text-sm font-semibold tracking-tight">{card.title}</div>
                  <ul className="mt-4 grid gap-2 text-sm text-[color-mix(in_srgb,var(--foreground)_72%,transparent)]">
                    {card.items.map((i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[color-mix(in_srgb,var(--foreground)_45%,transparent)]" />
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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
                  <h2 className="text-3xl font-semibold tracking-tight">Want a real plan for your business?</h2>
                  <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                    We’ll review your current setup and show you what’s costing you leads. Then you can decide whether you want help implementing it.
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
