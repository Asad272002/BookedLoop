import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

function normalizeUrl(value: string | undefined) {
  const v = (value || "").trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
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

  try {
    const admin = supabaseServer();
    const websiteUrl = normalizeUrl(website) ?? (website ? website.trim() : null);

    const { data: existingBizList } = await admin
      .from("businesses")
      .select("id, website, phone, email, niche, status")
      .ilike("business_name", businessName)
      .order("created_at", { ascending: false })
      .limit(1);

    const existingBiz = (existingBizList as unknown as Array<{
      id: string;
      website: string | null;
      phone: string | null;
      email: string | null;
      niche: string | null;
      status: string | null;
    }> | null)?.[0] ?? null;

    if (!existingBiz?.id) {
      const { data: inserted, error: insertErr } = await admin
        .from("businesses")
        .insert({
          business_name: businessName,
          niche: serviceInterest || businessType || null,
          website: websiteUrl,
          phone: phone || null,
          email,
          status: "new",
        })
        .select("id")
        .single();

      if (insertErr || !inserted?.id) {
        return NextResponse.json({ ok: false, error: "Could not save lead" }, { status: 500 });
      }
      const businessId = inserted.id;
      const contactRole = [serviceInterest || null, businessType || null].filter(Boolean).join(" · ") || null;
      await admin.from("contacts").insert({
        business_id: businessId,
        contact_name: name || null,
        email,
        phone: phone || null,
        role: contactRole,
      });
    } else {
      const businessId = existingBiz.id;
      const nextWebsite = existingBiz.website || websiteUrl;
      const nextPhone = existingBiz.phone || phone || null;
      const nextEmail = existingBiz.email || email;
      const nextNiche = existingBiz.niche || serviceInterest || businessType || null;
      if (
        nextWebsite !== existingBiz.website ||
        nextPhone !== existingBiz.phone ||
        nextEmail !== existingBiz.email ||
        nextNiche !== existingBiz.niche
      ) {
        await admin
          .from("businesses")
          .update({
            website: nextWebsite,
            phone: nextPhone,
            email: nextEmail,
            niche: nextNiche,
          })
          .eq("id", businessId);
      }
      const contactRole = [serviceInterest || null, businessType || null].filter(Boolean).join(" · ") || null;
      await admin.from("contacts").insert({
        business_id: businessId,
        contact_name: name || null,
        email,
        phone: phone || null,
        role: contactRole,
      });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save lead" }, { status: 500 });
  }

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
