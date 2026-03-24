import { NextResponse } from "next/server";

type ContactPayload = {
  name: string;
  businessName: string;
  email: string;
  phone?: string;
  website?: string;
  serviceInterest: string;
  businessType: string;
  problem: string;
  budget?: string;
  company?: string;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clean(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const payload = body as Partial<ContactPayload>;
  const name = clean(payload.name);
  const businessName = clean(payload.businessName);
  const email = clean(payload.email);
  const phone = clean(payload.phone) || undefined;
  const website = clean(payload.website) || undefined;
  const serviceInterest = clean(payload.serviceInterest);
  const businessType = clean(payload.businessType);
  const problem = clean(payload.problem);
  const budget = clean(payload.budget) || undefined;
  const company = clean(payload.company) || undefined;

  if (company) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Please enter your name.";
  if (businessName.length < 2)
    fieldErrors.businessName = "Please enter your business name.";
  if (!isEmail(email)) fieldErrors.email = "Please enter a valid email.";
  if (!serviceInterest) fieldErrors.serviceInterest = "Please choose a service.";
  if (!businessType) fieldErrors.businessType = "Please choose a business type.";
  if (problem.length < 10)
    fieldErrors.problem = "Please tell us a bit more (at least 10 characters).";

  if (Object.keys(fieldErrors).length) {
    return NextResponse.json(
      { ok: false, error: "Validation failed", fieldErrors },
      { status: 400 }
    );
  }

  const lead = {
    name,
    businessName,
    email,
    phone,
    website,
    serviceInterest,
    businessType,
    problem,
    budget,
    source: "bookedloop-site",
    receivedAt: new Date().toISOString(),
  };

  const webhookUrl = process.env.BOOKEDLOOP_CONTACT_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: "Delivery failed" },
          { status: 502 }
        );
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: "Delivery failed" },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
