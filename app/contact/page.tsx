import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ContactForm } from "@/components/ContactForm";
import { FadeUp } from "@/components/AnimateIn";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Book a free audit or request help from BookedLoop. Simple form, fast response, and clear next steps for local service businesses.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(58rem_30rem_at_10%_0%,color-mix(in_srgb,var(--accent-2)_22%,transparent),transparent_70%)]" />
        <Container className="relative py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
            <div className="space-y-5">
              <FadeUp>
                <Badge className="w-fit">Contact</Badge>
              </FadeUp>
              <FadeUp delay={0.05}>
                <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
                  Book a Free Audit or{" "}
                  <span className="bg-[linear-gradient(90deg,var(--accent-2),var(--accent))] bg-clip-text text-transparent">
                    ask a question
                  </span>
                  .
                </h1>
              </FadeUp>
              <FadeUp delay={0.08}>
                <p className="max-w-xl text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] sm:text-lg sm:leading-8">
                  Tell us what you’re trying to improve—more bookings, more reviews, faster follow-up, or a cleaner online presence. We’ll reply with clear next steps.
                </p>
              </FadeUp>
              <FadeUp delay={0.1}>
                <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] p-6">
                  <div className="text-sm font-semibold tracking-tight">What happens next</div>
                  <ul className="mt-4 grid gap-2 text-sm text-[color-mix(in_srgb,var(--foreground)_72%,transparent)]">
                    {[
                      "We review your website / social link if provided",
                      "We reply with priorities and practical recommendations",
                      "If it’s a fit, we suggest the simplest package to start",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckIcon className="mt-0.5 size-5 text-[var(--accent)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Button href={site.ctas.primary.href} variant="secondary">
                      {site.ctas.primary.label} <ArrowRightIcon className="size-5" />
                    </Button>
                    <Button href="/services" variant="ghost">
                      View services
                    </Button>
                  </div>
                </div>
              </FadeUp>
            </div>

            <FadeUp delay={0.1}>
              <Card className="p-6 sm:p-8">
                <div className="text-lg font-semibold tracking-tight">Send a message</div>
                <div className="mt-2 text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                  Prefer email?{" "}
                  <Link className="underline underline-offset-4 hover:text-[var(--foreground)]" href={`mailto:${site.contact.email}`}>
                    {site.contact.email}
                  </Link>
                </div>
                <div className="mt-6">
                  <Suspense>
                    <ContactForm />
                  </Suspense>
                </div>
              </Card>
            </FadeUp>
          </div>
        </Container>
      </section>

      <Section className="bg-[color-mix(in_srgb,var(--background)_92%,transparent)]">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight">Schedule your Free Audit</h2>
              <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                Pick a time that works for you using our Google scheduling link. If you’d rather not book yet, you can still send a message above and we’ll reply with next steps.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] p-6">
              <div className="text-sm font-semibold tracking-tight">Book instantly</div>
              <p className="mt-2 text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                Your scheduler timezone is currently set by your Google booking settings. If it’s not showing the timezone you want, update it in Google Calendar → Appointment schedules.
              </p>
              <div className="mt-5">
                <Button href={site.booking.freeAuditUrl} size="lg" className="w-full">
                  Open the Free Audit scheduler <ArrowRightIcon className="size-5" />
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
