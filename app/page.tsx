import Link from "next/link";

import { FadeUp, Stagger } from "@/components/AnimateIn";
import { HeroVisual } from "@/components/HeroVisual";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { ArrowRightIcon, BoltIcon, CalendarIcon, ShieldIcon, SparkIcon, StarIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { faqs, industries } from "@/lib/content/faqs";
import { sampleWork } from "@/lib/content/sampleWork";
import { services } from "@/lib/content/services";
import { site } from "@/lib/site";

export default function HomePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_10%_0%,color-mix(in_srgb,var(--accent-2)_28%,transparent),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50rem_28rem_at_90%_10%,color-mix(in_srgb,var(--accent)_20%,transparent),transparent_70%)]" />
        <Container className="relative py-16 sm:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <FadeUp>
                <Badge className="border-[color-mix(in_srgb,var(--accent-2)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent-2)_12%,transparent)]">
                  Built for local service businesses
                </Badge>
              </FadeUp>
              <FadeUp delay={0.05}>
                <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                  Turn missed leads into{" "}
                  <span className="bg-[linear-gradient(90deg,var(--accent-2),var(--accent))] bg-clip-text text-transparent">
                    booked clients
                  </span>
                  .
                </h1>
              </FadeUp>
              <FadeUp delay={0.08}>
                <p className="max-w-xl text-pretty text-base leading-7 text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] sm:text-lg sm:leading-8">
                  {site.name} helps small US service businesses get more bookings, earn more reviews,
                  and follow up faster with simple systems that stay out of the way.
                </p>
              </FadeUp>
              <FadeUp delay={0.1}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button href={site.ctas.primary.href} size="lg">
                    {site.ctas.primary.label}
                    <ArrowRightIcon className="size-5" />
                  </Button>
                  <Button href={site.ctas.secondary.href} size="lg" variant="secondary">
                    {site.ctas.secondary.label}
                  </Button>
                </div>
              </FadeUp>
              <FadeUp delay={0.12}>
                <div className="flex flex-wrap gap-2 text-xs text-[color-mix(in_srgb,var(--foreground)_60%,transparent)]">
                  <span className="inline-flex items-center gap-2">
                    <ShieldIcon className="size-4" /> Practical, not pushy
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <BoltIcon className="size-4" /> Faster response + follow-up
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <StarIcon className="size-4" /> Review-ready workflows
                  </span>
                </div>
              </FadeUp>
            </div>

            <FadeUp className="lg:justify-self-end" delay={0.06}>
              <HeroVisual />
            </FadeUp>
          </div>
        </Container>
      </section>

      <Section className="border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)]">
        <Container>
          <Stagger className="grid gap-3 md:grid-cols-5">
            {[
              { icon: SparkIcon, title: "Built for local service businesses", desc: "Salons, clinics, home services, studios, and more." },
              { icon: CalendarIcon, title: "Booking-focused systems", desc: "A clear next step on every important page." },
              { icon: StarIcon, title: "Review automation", desc: "Consistent requests that feel professional." },
              { icon: BoltIcon, title: "Faster follow-up", desc: "Reply quickly and keep leads moving." },
              { icon: ShieldIcon, title: "Simple workflows", desc: "Less chaos. More consistency." },
            ].map((item) => (
              <FadeUp key={item.title}>
                <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_70%,transparent)] p-4">
                  <item.icon className="size-5 text-[color-mix(in_srgb,var(--accent-2)_80%,var(--accent)_20%)]" />
                  <div className="mt-3 text-sm font-semibold tracking-tight">{item.title}</div>
                  <div className="mt-1 text-xs leading-5 text-[color-mix(in_srgb,var(--foreground)_64%,transparent)]">
                    {item.desc}
                  </div>
                </div>
              </FadeUp>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="flex flex-col gap-10">
            <div className="grid gap-3 md:grid-cols-2 md:items-end">
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold tracking-tight">Services that improve bookings, not just “marketing.”</h2>
                <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                  Pick a focused package, or combine what you need. Everything is built around one goal: make it easier for the next customer to book.
                </p>
              </div>
              <div className="md:justify-self-end">
                <Button href="/services" variant="secondary">
                  View all services <ArrowRightIcon className="size-5" />
                </Button>
              </div>
            </div>

            <Stagger className="grid gap-5 md:grid-cols-3">
              {services.slice(0, 3).map((svc) => (
                <FadeUp key={svc.id}>
                  <Card className="h-full bg-[color-mix(in_srgb,var(--card)_88%,transparent)]">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-lg font-semibold tracking-tight">{svc.name}</div>
                        {svc.badge ? (
                          <Badge className="border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
                            {svc.badge}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                        {svc.short}
                      </p>
                      <div className="text-sm font-medium text-[color-mix(in_srgb,var(--foreground)_78%,transparent)]">
                        {svc.pricingLines[0]}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Button href={svc.href} variant="secondary" className="w-full">
                        {svc.ctaLabel ?? "See Details"}
                      </Button>
                    </CardContent>
                  </Card>
                </FadeUp>
              ))}
            </Stagger>
          </div>
        </Container>
      </Section>

      <Section className="bg-[color-mix(in_srgb,var(--background)_92%,transparent)]">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
              <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                A clear process built for business owners. No long onboarding for the sake of it—just the work that moves bookings.
              </p>
            </div>

            <Stagger className="grid gap-4">
              {[
                { step: "1", title: "Audit", desc: "We review your website, booking path, reviews, and follow-up. You get priorities and quick wins." },
                { step: "2", title: "Setup", desc: "We build or improve the pieces that matter: pages, booking flow, review requests, and lead capture." },
                { step: "3", title: "Optimize", desc: "We tighten the messaging, remove friction, and make your booking path obvious across channels." },
                { step: "4", title: "Support / Grow", desc: "Ongoing updates and small improvements that keep results compounding without chaos." },
              ].map((item) => (
                <FadeUp key={item.step}>
                  <div className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] p-5">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent-2)_18%,transparent)] text-sm font-semibold text-[var(--foreground)]">
                      {item.step}
                    </div>
                    <div>
                      <div className="text-base font-semibold tracking-tight">{item.title}</div>
                      <div className="mt-1 text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </Stagger>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight">Why businesses lose leads (even when they’re “busy”)</h2>
              <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                Most local businesses don’t have a traffic problem—they have a conversion and follow-up problem. People look you up, hesitate, then move on.
              </p>
              <ul className="grid gap-2 text-sm text-[color-mix(in_srgb,var(--foreground)_78%,transparent)]">
                {[
                  "Outdated website that doesn’t explain services clearly",
                  "No obvious booking option (or booking is buried)",
                  "No review follow-up system, so the best customers stay silent",
                  "Inactive social presence that makes you look “closed”",
                  "Slow response time to calls, forms, or DMs",
                  "No reminders, confirmations, or rebooking prompts",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Card className="overflow-hidden">
              <div className="bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-2)_22%,transparent),transparent_55%,color-mix(in_srgb,var(--accent)_18%,transparent))] p-6">
                <div className="text-sm font-semibold tracking-tight">The fix is simple:</div>
                <div className="mt-2 text-2xl font-semibold tracking-tight">
                  Make booking the default next step.
                </div>
                <div className="mt-3 text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                  We build a clean path from “found you” → “trust you” → “booked.” Then we add review and follow-up systems so you keep winning the next appointment too.
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button href={site.ctas.primary.href}>
                    {site.ctas.primary.label} <ArrowRightIcon className="size-5" />
                  </Button>
                  <Button href="/services" variant="secondary">
                    Explore services
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      <Section className="bg-[color-mix(in_srgb,var(--background)_92%,transparent)]">
        <Container>
          <div className="flex flex-col gap-10">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight">Demo case studies & sample work</h2>
              <p className="max-w-2xl text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                These are labeled examples so you can see the style and structure BookedLoop delivers. Replace with real projects and results as you collect them.
              </p>
            </div>

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
                      <div className="flex flex-wrap gap-2">
                        {item.focus.map((tag) => (
                          <Badge key={tag} className="bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button href="/sample-work" variant="secondary" className="w-full">
                        View sample details
                      </Button>
                    </CardContent>
                  </Card>
                </FadeUp>
              ))}
            </Stagger>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight">Who we help</h2>
              <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                If your business depends on local trust and consistent bookings, this is built for you.
              </p>
              <div className="flex flex-wrap gap-2">
                {industries.map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight">BookedLoop, explained</h2>
              <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                We’re a small, focused agency that builds practical growth systems for service businesses. No mystery retainers and no “growth hacks.” Just clean execution: stronger pages, better booking flow, review automation, and follow-up.
              </p>
              <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] p-5">
                <div className="text-sm font-semibold tracking-tight">Founder-style note</div>
                <p className="mt-2 text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                  BookedLoop exists because local businesses shouldn’t lose leads due to messy systems. A few smart improvements can make booking feel effortless—for your customers and your team.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button href="/about" variant="secondary">
                  About BookedLoop
                </Button>
                <Button href="/contact" variant="ghost">
                  Ask a question <ArrowRightIcon className="size-5" />
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-[color-mix(in_srgb,var(--background)_92%,transparent)]">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight">FAQ</h2>
              <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                Clear answers, no fluff. If you have a specific question, send it through the contact form.
              </p>
            </div>
            <div className="grid gap-3">
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
              />
              {faqs.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] p-5"
                >
                  <summary className="cursor-pointer list-none text-sm font-semibold tracking-tight">
                    <span className="flex items-center justify-between gap-4">
                      {item.question}
                      <span className="text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] transition group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <div className="mt-3 text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                    {item.answer}
                  </div>
                </details>
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
                  <h2 className="text-3xl font-semibold tracking-tight">Get a Free Audit</h2>
                  <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                    If your calendar isn’t as full as it should be, we’ll show you what’s leaking leads and what to fix first.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button href={site.ctas.primary.href} size="lg">
                      {site.ctas.primary.label} <ArrowRightIcon className="size-5" />
                    </Button>
                    <Button href="/contact" variant="secondary" size="lg">
                      Contact BookedLoop
                    </Button>
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_72%,transparent)] p-6">
                  <div className="text-sm font-semibold tracking-tight">What you’ll get</div>
                  <ul className="mt-4 grid gap-2 text-sm text-[color-mix(in_srgb,var(--foreground)_75%,transparent)]">
                    {[
                      "A quick review of your website + booking path",
                      "Review and reputation quick wins",
                      "Follow-up and response improvements",
                      "Clear priorities you can act on",
                    ].map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--accent-2)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
                    Prefer email?{" "}
                    <Link className="underline underline-offset-4 hover:text-[var(--foreground)]" href={`mailto:${site.contact.email}`}>
                      {site.contact.email}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Container>
      </Section>
    </div>
  );
}
