import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { supabaseServer } from "@/lib/supabase/server";
import crypto from "crypto";

export const runtime = "nodejs";

function b64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getServiceAccount() {
  const svcEmailRaw = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const svcKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const svcEmail = (svcEmailRaw || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/,+$/, "");
  if (svcEmail && svcKeyRaw) {
    const private_key = (svcKeyRaw || "")
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/,+$/, "")
      .replace(/\\n/g, "\n");
    return { client_email: svcEmail, private_key };
  }
  if (process.env.NODE_ENV === "production") return null;
  const pathMod = await import("path");
  const { readFile } = await import("fs/promises");
  const localPath =
    process.env.BL_GOOGLE_SVC_JSON_PATH ||
    pathMod.join(/*turbopackIgnore: true*/ process.cwd(), "serviceaccount", "service.json");
  try {
    const raw = await readFile(localPath, "utf8");
    const json = JSON.parse(raw) as { client_email: string; private_key: string };
    return { client_email: json.client_email, private_key: json.private_key };
  } catch {
    return null;
  }
}

function buildAssertion(clientEmail: string, privateKey: string, scopes: string[]) {
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error("Invalid private key format");
  }
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: scopes.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    iat,
    exp,
  };
  const encodedHeader = b64url(JSON.stringify(header));
  const encodedPayload = b64url(JSON.stringify(payload));
  const input = `${encodedHeader}.${encodedPayload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(input);
  signer.end();
  const signature = b64url(signer.sign(privateKey));
  return `${input}.${signature}`;
}

async function getAccessToken(clientEmail: string, privateKey: string) {
  const assertion = buildAssertion(clientEmail, privateKey, ["https://www.googleapis.com/auth/calendar.readonly"]);
  const body = new URLSearchParams();
  body.set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  body.set("assertion", assertion);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    return null;
  }
  const json = (await res.json()) as { access_token?: string };
  return json.access_token || null;
}

export async function POST(req: Request) {
  const jar = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return jar.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          jar.set(name, value, {
            ...options,
            path: options?.path ?? "/",
            sameSite: options?.sameSite ?? "lax",
            secure: options?.secure ?? process.env.NODE_ENV === "production",
          });
        });
      },
    },
  });
  const authUserId = (await supabase.auth.getUser()).data.user?.id ?? null;
  if (!authUserId) return NextResponse.redirect(new URL("/admin/login", req.url));
  const admin = supabaseServer();
  const { data: me } = await admin.from("users").select("role").eq("auth_user_id", authUserId).maybeSingle();
  const role = (me?.role as string | null) ?? "caller";
  if (role !== "admin" && role !== "manager") {
    return NextResponse.redirect(new URL("/admin/audits?error=forbidden", req.url));
  }

  const form = await req.formData();
  const formIds = String(form.get("calendarId") || "").trim();
  const envIds = (process.env.GOOGLE_CALENDAR_ID || "")
    .trim()
    .replace(/^["']|["']$/g, "");
  const idsRaw = formIds || envIds;
  if (!idsRaw) {
    return NextResponse.redirect(new URL("/admin/audits?error=calendar_missing", req.url));
  }
  const calendarIds = idsRaw
    .split(",")
    .map((s) =>
      s
        .trim()
        .replace(/^["']|["']$/g, "")
        .replace(/,+$/, "")
    )
    .filter(Boolean);

  const svc = await getServiceAccount();
  if (!svc) {
    return NextResponse.redirect(new URL("/admin/audits?error=calendar_sync_failed", req.url));
  }
  const token = await getAccessToken(svc.client_email, svc.private_key);
  if (!token) {
    return NextResponse.redirect(new URL("/admin/audits?error=calendar_sync_failed", req.url));
  }

  const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  type AppointmentInsert = {
    appointment_type: string;
    appointment_datetime: string | null;
    timezone: string | null;
    status: string;
    calendar_event_id: string | null;
    calendar_event_url: string | null;
    notes: string | null;
    business_id?: string | null;
  };
  const rows: AppointmentInsert[] = [];
  const names = new Set<string>();
  for (const cal of calendarIds) {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal)}/events`);
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", timeMax);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    const res = await fetch(url.toString(), {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) continue;
    const data = (await res.json()) as {
      items?: Array<{
        id?: string;
        status?: string;
        summary?: string;
        description?: string;
        htmlLink?: string;
        start?: { dateTime?: string; date?: string; timeZone?: string };
        end?: { dateTime?: string; date?: string; timeZone?: string };
      }>;
    };
    for (const ev of data.items || []) {
      const startIso = ev.start?.dateTime || (ev.start?.date ? new Date(ev.start.date).toISOString() : null);
      const tz = ev.start?.timeZone || null;
      const status = ev.status === "cancelled" ? "cancelled" : "scheduled";
      const title = (ev.summary || "Calendar Event").trim().slice(0, 160);
      if (title) names.add(title);
      rows.push({
        appointment_type: "audit",
        appointment_datetime: startIso,
        timezone: tz,
        status,
        calendar_event_id: ev.id || null,
        calendar_event_url: ev.htmlLink || null,
        notes: [ev.summary || null, ev.description || null].filter(Boolean).join("\n") || null,
      });
    }
  }

  if (rows.length) {
    // Ensure business_id exists (many schemas require NOT NULL). Use event title as a placeholder business.
    const titles = Array.from(names);
    const existingMap = new Map<string, string>();
    if (titles.length) {
      const { data: existing } = await admin.from("businesses").select("id, business_name").in("business_name", titles);
      (existing || []).forEach((b: { id: string; business_name: string }) => existingMap.set(b.business_name, b.id));
      const missing = titles.filter((t) => !existingMap.has(t));
      if (missing.length) {
        const { data: inserted } = await admin
          .from("businesses")
          .insert(missing.map((m) => ({ business_name: m, status: "audit_booked" })))
          .select("id, business_name");
        (inserted || []).forEach((b: { id: string; business_name: string }) => existingMap.set(b.business_name, b.id));
      }
    }
    // Attach business_id by matching title extracted from notes (first line)
    rows.forEach((r) => {
      const firstLine = (r.notes || "").split("\n")[0]?.trim() || "Calendar Event";
      const key = existingMap.has(firstLine) ? firstLine : "Calendar Event";
      r.business_id = existingMap.get(key) || null;
    });

    const { error } = await admin.from("appointments").upsert(rows, { onConflict: "calendar_event_id" });
    if (error) {
      for (const r of rows) {
        const { data: existing } = await admin.from("appointments").select("id").eq("calendar_event_id", r.calendar_event_id).maybeSingle();
        if (existing?.id) {
          await admin.from("appointments").update(r).eq("id", existing.id);
        } else {
          await admin.from("appointments").insert(r);
        }
      }
    }
  }

  return NextResponse.redirect(new URL("/admin/audits?toast=audits_synced", req.url));
}
