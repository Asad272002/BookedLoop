import type { Metadata } from "next";

import { FadeUp } from "@/components/AnimateIn";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { ArrowRightIcon, CheckIcon, ShieldIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { industries } from "@/lib/content/faqs";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "About BookedLoop: a practical growth-focused agency helping local service businesses improve bookings, reviews, follow-up, and online presence.",
};

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(58rem_30rem_at_10%_0%,color-mix(in_srgb,var(--accent-2)_22%,transparent),transparent_70%)]" />
        <Container className="relative py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
            <div className="space-y-5">
              <FadeUp>
                <Badge className="w-fit">About</Badge>
              </FadeUp>
              <FadeUp delay={0.05}>
                <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
                  {site.name} builds{" "}
                  <span className="bg-[linear-gradient(90deg,var(--accent-2),var(--accent))] bg-clip-text text-transparent">
                    simple systems
                  </span>{" "}
                  that help local businesses grow.
                </h1>
              </FadeUp>
              <FadeUp delay={0.08}>
                <p className="max-w-xl text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] sm:text-lg sm:leading-8">
                  Most owners don’t need more tools. They need a clean booking path, better follow-up, and an online presence that looks trustworthy. That’s what we build.
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
              <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                <ShieldIcon className="size-5 text-[color-mix(in_srgb,var(--accent-2)_80%,var(--accent)_20%)]" />
                How we work
              </div>
              <ul className="mt-4 grid gap-2 text-sm text-[color-mix(in_srgb,var(--foreground)_72%,transparent)]">
                {[
                  "We focus on outcomes: bookings, reviews, and faster follow-up.",
                  "We keep systems simple so your team actually uses them.",
                  "We build in a way that’s easy to edit later.",
                  "We don’t use fake testimonials or made-up numbers.",
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
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight">Why BookedLoop exists</h2>
              <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                Local businesses lose leads for boring reasons: a confusing website, unclear services, slow responses, or no follow-up. These are solvable with a few well-built loops.
              </p>
              <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                We’re remote-first and built to support businesses across the US. That means you get clear communication, clean deliverables, and systems you can keep using.
              </p>
            </div>
            <div className="space-y-4">
              <Card className="p-6">
                <div className="text-sm font-semibold tracking-tight">Founder-style intro</div>
                <p className="mt-2 text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                  BookedLoop is intentionally focused. We don’t try to do everything. We help you get more of the right customers by tightening your booking flow, your reputation, and your follow-up.
                </p>
                <p className="mt-3 text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                  If you’re a hands-on owner, we’ll keep it simple and teach your team how it works. If you’d rather stay out of it, we can handle more of the execution.
                </p>
              </Card>
              <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] p-6">
                <div className="text-sm font-semibold tracking-tight">Who we help most</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {industries.map((item) => (
                    <Badge key={item}>{item}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-[color-mix(in_srgb,var(--background)_92%,transparent)]">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight">What you can expect</h2>
              <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                Clean deliverables, honest messaging, and a booking-first approach that’s easy to maintain.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { t: "Clarity", d: "Straightforward recommendations and a clean plan." },
                { t: "Execution", d: "We build the assets and workflows, not just slides." },
                { t: "Maintainability", d: "Systems that you can edit later without rebuilding everything." },
                { t: "Consistency", d: "Small improvements that compound over time." },
              ].map((c) => (
                <div
                  key={c.t}
                  className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] p-6"
                >
                  <div className="text-sm font-semibold tracking-tight">{c.t}</div>
                  <div className="mt-2 text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                    {c.d}
                  </div>
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
                  <h2 className="text-3xl font-semibold tracking-tight">Ready for a cleaner booking flow?</h2>
                  <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                    Book a Free Audit and we’ll map out the fastest improvements for your business.
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
