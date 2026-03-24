"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FieldError, FieldHint, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { services } from "@/lib/content/services";

type FormState = {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  website: string;
  serviceInterest: string;
  businessType: string;
  problem: string;
  budget: string;
  company: string;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toInitial(intent: string | null): Partial<FormState> {
  if (!intent) return {};
  if (intent === "free-audit") return { serviceInterest: "Free Audit" };
  if (intent === "pricing") return { serviceInterest: "Not sure yet" };
  return {};
}

const serviceOptions = [
  "Free Audit",
  ...services.map((s) => s.name),
  "Not sure yet",
] as const;

const businessTypeOptions = [
  "Salon / spa",
  "Barber shop",
  "Clinic / wellness",
  "Fitness studio",
  "Home service",
  "Repair shop",
  "Tutor / lessons",
  "Local professional service",
  "Other",
] as const;

const budgetOptions = [
  "Not sure yet",
  "Under $1,000/mo",
  "$1,000–$3,000/mo",
  "$3,000–$7,500/mo",
  "$7,500+/mo",
] as const;

export function ContactForm() {
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");

  const [form, setForm] = React.useState<FormState>(() => ({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    website: "",
    serviceInterest: "Free Audit",
    businessType: "",
    problem: "",
    budget: "",
    company: "",
    ...toInitial(intent),
  }));

  React.useEffect(() => {
    const next = toInitial(intent);
    if (next.serviceInterest) {
      setForm((prev) => ({ ...prev, serviceInterest: next.serviceInterest ?? prev.serviceInterest }));
    }
  }, [intent]);

  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const onChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Please enter your name.";
    if (form.businessName.trim().length < 2) next.businessName = "Please enter your business name.";
    if (!isEmail(form.email.trim())) next.email = "Please enter a valid email.";
    if (!form.serviceInterest.trim()) next.serviceInterest = "Please choose a service.";
    if (!form.businessType.trim()) next.businessType = "Please choose a business type.";
    if (form.problem.trim().length < 10) next.problem = "Please tell us a bit more (at least 10 characters).";
    return next;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const nextErrors = validate();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          businessName: form.businessName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          website: form.website.trim() || undefined,
          problem: form.problem.trim(),
          budget: form.budget.trim() || undefined,
          company: form.company.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string; fieldErrors?: Record<string, string> }
          | null;
        setError(data?.error ?? "Something went wrong. Please try again.");
        if (data?.fieldErrors) setFieldErrors(data.fieldErrors);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] p-6">
        <div className="text-lg font-semibold tracking-tight">Message received</div>
        <p className="mt-2 text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_72%,transparent)]">
          Thanks—your request is in. If you included a website or social link, we’ll take a look before replying.
        </p>
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] p-4">
          <div className="text-sm font-semibold tracking-tight">What happens next</div>
          <ul className="mt-3 grid gap-2 text-sm text-[color-mix(in_srgb,var(--foreground)_75%,transparent)]">
            <li className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--accent-2)]" />
              <span>We review your current booking path and presence.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              <span>We reply with clear priorities and next steps.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[color-mix(in_srgb,var(--foreground)_55%,transparent)]" />
              <span>If it’s a fit, we’ll suggest the simplest package to start.</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={form.name} onChange={onChange("name")} autoComplete="name" />
          {fieldErrors.name ? <FieldError>{fieldErrors.name}</FieldError> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input id="businessName" value={form.businessName} onChange={onChange("businessName")} />
          {fieldErrors.businessName ? <FieldError>{fieldErrors.businessName}</FieldError> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={form.email} onChange={onChange("email")} autoComplete="email" />
          {fieldErrors.email ? <FieldError>{fieldErrors.email}</FieldError> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={form.phone} onChange={onChange("phone")} autoComplete="tel" />
          <FieldHint>Optional</FieldHint>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website / Social link</Label>
        <Input id="website" value={form.website} onChange={onChange("website")} placeholder="https://…" />
        <FieldHint>Optional</FieldHint>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="serviceInterest">What service are you interested in?</Label>
          <Select id="serviceInterest" value={form.serviceInterest} onChange={onChange("serviceInterest")}>
            {serviceOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
          {fieldErrors.serviceInterest ? <FieldError>{fieldErrors.serviceInterest}</FieldError> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessType">Business type</Label>
          <Select id="businessType" value={form.businessType} onChange={onChange("businessType")}>
            <option value="">Select…</option>
            {businessTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
          {fieldErrors.businessType ? <FieldError>{fieldErrors.businessType}</FieldError> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="problem">What problem are you trying to solve?</Label>
        <Textarea
          id="problem"
          value={form.problem}
          onChange={onChange("problem")}
          placeholder="Example: We get inquiries but people don’t book. We also don’t request reviews consistently."
        />
        {fieldErrors.problem ? <FieldError>{fieldErrors.problem}</FieldError> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Monthly marketing budget</Label>
        <Select id="budget" value={form.budget} onChange={onChange("budget")}>
          <option value="">Optional</option>
          {budgetOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
      </div>

      <div className="hidden">
        <Label htmlFor="company">Company</Label>
        <Input id="company" value={form.company} onChange={onChange("company")} tabIndex={-1} autoComplete="off" />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <Button
        size="lg"
        className="w-full"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Sending…" : "Send Request"}
      </Button>
    </form>
  );
}
