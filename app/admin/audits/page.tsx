import dayjs from "dayjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { supabaseServer } from "@/lib/supabase/server";

type AuditRow = {
  id: string;
  appointment_type: string | null;
  appointment_datetime: string | null;
  timezone: string | null;
  status: string | null;
  calendar_event_id: string | null;
  calendar_event_url: string | null;
  audit_outcome: string | null;
  notes: string | null;
  created_at?: string;
  business?: { business_name: string | null } | null;
  contact?: { contact_name: string | null; email: string | null; phone: string | null } | null;
  created_by?: { username: string | null; full_name: string | null } | null;
};

type AuditQueryRowV2 = {
  id: string;
  appointment_type: string | null;
  appointment_datetime: string | null;
  timezone: string | null;
  status: string | null;
  calendar_event_id: string | null;
  calendar_event_url: string | null;
  audit_outcome: string | null;
  notes: string | null;
  businesses: { business_name: string | null } | null;
  contacts: { contact_name: string | null; email: string | null; phone: string | null } | null;
  users: { username: string | null; full_name: string | null } | null;
};

type AuditQueryRowV1 = {
  id: string;
  appointment_type: string | null;
  appointment_datetime: string | null;
  timezone: string | null;
  status: string | null;
  calendar_event_id: string | null;
  notes: string | null;
  businesses: { business_name: string | null } | null;
  contacts: { contact_name: string | null; email: string | null; phone: string | null } | null;
  users: { username: string | null; full_name: string | null } | null;
};

const statusOptions = ["scheduled", "completed", "cancelled", "no_show"] as const;

function formatWhen(value: string | null) {
  if (!value) return "—";
  const d = dayjs(value);
  if (!d.isValid()) return value;
  return d.format("YYYY-MM-DD h:mm A");
}

function parseContactFromNotes(notes: string | null) {
  const raw = notes || "";
  const txt = raw.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?[^>]+>/g, "");
  const lines = txt.split("\n").map((l) => l.trim()).filter(Boolean);

  const emailMatch = txt.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = txt.match(/(\+?\d[\d\s().-]{6,}\d)/);
  const urlMatch = txt.match(/https?:\/\/[^\s)]+/i);

  function normLabel(v: string) {
    return v
      .toLowerCase()
      .replace(/[*:]/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function normalizeUrl(v: string | null) {
    if (!v) return null;
    const s = v.trim();
    if (!s) return null;
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.includes(" ")) return null;
    return `https://${s}`;
  }

  function findField(label: string) {
    const target = normLabel(label);
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const low = normLabel(l);
      if (low === target) {
        const next = lines[i + 1] || "";
        return next ? next.trim() : null;
      }
      if (low.startsWith(target + " ")) {
        const after = l.replace(new RegExp(`^\\s*${label}\\s*[:*]?\\s*`, "i"), "").trim();
        return after || null;
      }
    }
    return null;
  }

  const first = findField("first name");
  const last = findField("surname") || findField("last name");
  const email = findField("email address") || emailMatch?.[0] || null;
  const phone = findField("phone number") || phoneMatch?.[0] || null;
  const listing =
    normalizeUrl(findField("business listing link")) ||
    normalizeUrl(findField("bussiness listing link")) ||
    normalizeUrl(findField("google business profile link")) ||
    normalizeUrl(findField("gbp link")) ||
    normalizeUrl(urlMatch?.[0] || null);

  const fullName = [first, last].filter(Boolean).join(" ").trim() || null;
  let name: string | null = null;

  for (const l of lines) {
    if (!l) continue;
    const low = l.toLowerCase();
    if (low.startsWith("booked by") || low === "booked by:") continue;
    if (low === "first name" || low === "surname" || low === "last name" || low === "email address" || low === "phone number" || low === "business listing link") continue;
    if (low.includes("appointment")) continue;
    if (low.includes("audit")) continue;
    if (email && l.includes(email)) continue;
    if (phone && l.includes(phone)) continue;
    if (l.length >= 2 && l.length <= 80) {
      name = l;
      break;
    }
  }

  if (!name && lines.length) {
    const first = lines[0];
    const paren = first.match(/\(([^)]+)\)/);
    if (paren && paren[1] && paren[1].length <= 80) {
      name = paren[1];
    }
  }

  return {
    name: fullName || name,
    email,
    phone,
    link: listing,
  };
}

function stripHtml(input: string) {
  return input.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?[^>]+>/g, "");
}

function shortUrl(url: string) {
  const s = url.replace(/^https?:\/\//i, "").replace(/\/+$/g, "");
  if (s.length <= 42) return s;
  return `${s.slice(0, 26)}…${s.slice(-10)}`;
}
export default async function AuditsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; time?: "all" | "upcoming" | "past" | "overdue"; audit?: string }>;
}) {
  const sp = (await searchParams) ?? {};
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
  const isProd = process.env.NODE_ENV === "production";
  const role = isProd
    ? ((await supabase.auth.getSession()).data.session?.user.app_metadata?.role as string | undefined) ?? "caller"
    : ((await supabase.auth.getUser()).data.user?.app_metadata?.role as string | undefined) ?? "caller";
  if (role !== "admin" && role !== "manager") redirect("/admin");

  async function createAudit(formData: FormData) {
    "use server";
    const businessName = String(formData.get("businessName") || "").trim();
    const contactName = String(formData.get("contactName") || "").trim();
    const contactEmail = String(formData.get("contactEmail") || "").trim();
    const contactPhone = String(formData.get("contactPhone") || "").trim();
    const whenLocal = String(formData.get("when") || "").trim();
    const timezone = String(formData.get("timezone") || "").trim() || "UTC";
    const calendarUrl = String(formData.get("calendarUrl") || "").trim();
    const notes = String(formData.get("notes") || "").trim();

    if (!businessName || !whenLocal) redirect("/admin/audits");

    const whenIso = new Date(whenLocal).toISOString();
    const admin = supabaseServer();

    const { data: biz, error: bizErr } = await admin
      .from("businesses")
      .insert({ business_name: businessName, status: "audit_booked" })
      .select("id")
      .single();
    if (bizErr || !biz?.id) redirect("/admin/audits");

    let contactId: string | null = null;
    if (contactName || contactEmail || contactPhone) {
      const { data: c, error: cErr } = await admin
        .from("contacts")
        .insert({
          business_id: biz.id,
          contact_name: contactName || null,
          email: contactEmail || null,
          phone: contactPhone || null,
        })
        .select("id")
        .single();
      if (!cErr && c?.id) contactId = c.id;
    }

    const { error: insertErr } = await admin.from("appointments").insert({
      business_id: biz.id,
      contact_id: contactId,
      appointment_type: "audit",
      appointment_datetime: whenIso,
      timezone,
      status: "scheduled",
      calendar_event_url: calendarUrl || null,
      notes: notes || null,
    });

    if (insertErr && insertErr.message.includes("calendar_event_url")) {
      await admin.from("appointments").insert({
        business_id: biz.id,
        contact_id: contactId,
        appointment_type: "audit",
        appointment_datetime: whenIso,
        timezone,
        status: "scheduled",
        calendar_event_id: calendarUrl || null,
        notes: notes || null,
      });
    }

    redirect("/admin/audits");
  }

  async function updateAudit(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim();
    const calendarUrl = String(formData.get("calendarUrl") || "").trim();
    const outcome = String(formData.get("outcome") || "").trim();
    const notes = String(formData.get("notes") || "").trim();
    if (!id) redirect("/admin/audits");

    const admin = supabaseServer();
    const { error: updateErr } = await admin
      .from("appointments")
      .update({
        status: status || null,
        calendar_event_url: calendarUrl || null,
        audit_outcome: outcome || null,
        notes: notes || null,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (updateErr && (updateErr.message.includes("calendar_event_url") || updateErr.message.includes("audit_outcome") || updateErr.message.includes("completed_at"))) {
      const mergedNotes = [outcome ? `Outcome: ${outcome}` : null, notes || null].filter(Boolean).join("\n");
      await admin
        .from("appointments")
        .update({
          status: status || null,
          calendar_event_id: calendarUrl || null,
          notes: mergedNotes || null,
        })
        .eq("id", id);
    }

    redirect("/admin/audits");
  }

  const admin = supabaseServer();
  let auditsV2: AuditQueryRowV2[] | null = null;
  let usingV2 = true;

  const { data: firstData, error: firstErr } = await admin
    .from("appointments")
    .select(
      "id, appointment_type, appointment_datetime, timezone, status, calendar_event_id, calendar_event_url, audit_outcome, notes, businesses(business_name), contacts(contact_name, email, phone), users(username, full_name)"
    )
    .eq("appointment_type", "audit")
    .order("appointment_datetime", { ascending: false });

  if (firstErr && (firstErr.message.includes("calendar_event_url") || firstErr.message.includes("audit_outcome"))) {
    usingV2 = false;
    const { data: fallback } = await admin
      .from("appointments")
      .select(
        "id, appointment_type, appointment_datetime, timezone, status, calendar_event_id, notes, businesses(business_name), contacts(contact_name, email, phone), users(username, full_name)"
      )
      .eq("appointment_type", "audit")
      .order("appointment_datetime", { ascending: false });
    auditsV2 = (fallback as unknown as AuditQueryRowV2[] | null) ?? null;
  } else {
    auditsV2 = (firstData as unknown as AuditQueryRowV2[] | null) ?? null;
  }

  const rows = (auditsV2 as unknown as (AuditQueryRowV2 | AuditQueryRowV1)[] | null)?.map((row) => {
    const r = row as AuditQueryRowV2;
    return {
      id: row.id,
      appointment_type: row.appointment_type,
      appointment_datetime: row.appointment_datetime,
      timezone: row.timezone,
      status: row.status,
      calendar_event_id: row.calendar_event_id,
      calendar_event_url: usingV2 ? r.calendar_event_url : row.calendar_event_id,
      audit_outcome: usingV2 ? r.audit_outcome : null,
      notes: row.notes,
      business: row.businesses ?? null,
      contact: row.contacts ?? null,
      created_by: row.users ?? null,
    } satisfies AuditRow;
  }) ?? null;

  const nowIso = new Date().toISOString();
  const filtered =
    rows?.filter((a) => {
      const matchesStatus = sp.status ? (a.status || "").toLowerCase() === sp.status!.toLowerCase() : true;
      const when = a.appointment_datetime ? new Date(a.appointment_datetime).toISOString() : null;
      const isPast = when ? when < nowIso : false;
      const isOverdue = (a.status === "scheduled") && isPast;
      const matchesTime =
        sp.time === "upcoming" ? !isPast :
        sp.time === "past" ? isPast :
        sp.time === "overdue" ? isOverdue :
        true;
      return matchesStatus && matchesTime;
    }) ?? [];

  const baseParams = new URLSearchParams();
  if (sp.status) baseParams.set("status", sp.status);
  if (sp.time) baseParams.set("time", sp.time);

  const selectedAudit = sp.audit ? rows?.find((r) => r.id === sp.audit) ?? null : null;

  const hasEnvCalendar = Boolean((process.env.GOOGLE_CALENDAR_ID || "").trim());
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-lg font-semibold tracking-tight">Audits</div>
        <form method="get" className="flex items-center gap-2">
          <Select name="status" defaultValue={sp.status || ""}>
            <option value="">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select name="time" defaultValue={sp.time || "all"}>
            <option value="all">All times</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="overdue">Overdue</option>
          </Select>
          <Button type="submit" variant="ghost" size="sm">Filter</Button>
        </form>
        <form method="post" action="/admin/audits/sync" className="flex items-center gap-2">
          {!hasEnvCalendar ? (
            <>
              <Input
                name="calendarId"
                placeholder="Calendar ID (email or ID)"
                className="w-64"
                required
              />
            </>
          ) : null}
          <Button type="submit" variant="secondary" size="sm">
            Sync Calendar
          </Button>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Scheduled & completed audits</div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {!filtered.length ? (
              <div className="rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-3 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                No audits logged yet.
              </div>
            ) : null}

            {filtered.map((a) => {
              const isPast = a.appointment_datetime ? new Date(a.appointment_datetime) < new Date() : false;
              const isOverdue = a.status === "scheduled" && isPast;
              const parsed = parseContactFromNotes(a.notes || "");
              const contactName = stripHtml(a.contact?.contact_name || parsed.name || "—");
              const contactEmail = stripHtml(a.contact?.email || parsed.email || "—");
              const contactPhone = stripHtml(a.contact?.phone || parsed.phone || "—");
              const businessLink = parsed.link || null;
              const moreParams = new URLSearchParams(baseParams);
              moreParams.set("audit", a.id);
              const moreHref = `/admin/audits?${moreParams.toString()}`;
              return (
              <div
                key={a.id}
                className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold tracking-tight">{a.business?.business_name || "Unknown business"}</div>
                    <div className="mt-1 text-xs text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                      {formatWhen(a.appointment_datetime)} {a.timezone ? `(${a.timezone})` : ""} · {a.status || "—"}
                      {isOverdue ? <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-red-700">overdue</span> : null}
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                      <div><span className="font-medium">Booker:</span> {contactName}</div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <div>
                          <span className="font-medium">Email:</span>{" "}
                          {contactEmail && contactEmail !== "—" ? (
                            <a href={`mailto:${contactEmail}`} className="underline underline-offset-4">{contactEmail}</a>
                          ) : "—"}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span>{" "}
                          {contactPhone && contactPhone !== "—" ? (
                            <a href={`tel:${contactPhone.replace(/\s+/g, "")}`} className="underline underline-offset-4">{contactPhone}</a>
                          ) : "—"}
                        </div>
                        {businessLink ? (
                          <div>
                            <span className="font-medium">Business Listing Link:</span>{" "}
                            <a href={businessLink} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                              {shortUrl(businessLink)}
                            </a>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button href={moreHref} variant="secondary" size="sm">
                        More info
                      </Button>
                      {a.calendar_event_url ? (
                        <Button href={a.calendar_event_url} variant="ghost" size="sm">
                          Open event
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Log a new audit</div>
          </CardHeader>
          <CardContent>
            <form action={createAudit} className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="businessName">Business name</Label>
                <Input id="businessName" name="businessName" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="when">Audit date/time</Label>
                <Input id="when" name="when" type="datetime-local" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" name="timezone" placeholder="Example: America/New_York" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="calendarUrl">Google Calendar link</Label>
                <Input id="calendarUrl" name="calendarUrl" placeholder="https://calendar.google.com/..." />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="contactName">Contact name</Label>
                  <Input id="contactName" name="contactName" placeholder="Optional" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactPhone">Contact phone</Label>
                  <Input id="contactPhone" name="contactPhone" placeholder="Optional" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactEmail">Contact email</Label>
                <Input id="contactEmail" name="contactEmail" placeholder="Optional" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Optional" />
              </div>
              <Button type="submit" className="w-full">
                Add audit
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      {selectedAudit ? (() => {
        const a = selectedAudit;
        const parsed = parseContactFromNotes(a.notes || "");
        const contactName = stripHtml(a.contact?.contact_name || parsed.name || "—");
        const contactEmail = stripHtml(a.contact?.email || parsed.email || "—");
        const contactPhone = stripHtml(a.contact?.phone || parsed.phone || "—");
        const businessLink = parsed.link || null;
        const closeParams = new URLSearchParams(baseParams);
        const closeHref = closeParams.toString() ? `/admin/audits?${closeParams.toString()}` : "/admin/audits";
        const isPast = a.appointment_datetime ? new Date(a.appointment_datetime) < new Date() : false;
        const isOverdue = a.status === "scheduled" && isPast;
        return (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] p-4">
                <div className="min-w-0">
                  <div className="text-base font-semibold tracking-tight">{a.business?.business_name || "Audit"}</div>
                  <div className="mt-1 text-xs text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                    {formatWhen(a.appointment_datetime)} {a.timezone ? `(${a.timezone})` : ""} · {a.status || "—"}
                    {isOverdue ? <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-red-700">overdue</span> : null}
                  </div>
                </div>
                <Button href={closeHref} variant="ghost" size="sm">
                  Close
                </Button>
              </div>

              <div className="grid gap-4 p-4">
                <div className="grid gap-2 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] p-4">
                  <div className="text-sm font-semibold tracking-tight">Booking</div>
                  <div className="grid gap-1 text-sm">
                    <div><span className="font-medium">Booker:</span> {contactName}</div>
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {contactEmail && contactEmail !== "—" ? (
                        <a href={`mailto:${contactEmail}`} className="underline underline-offset-4">{contactEmail}</a>
                      ) : "—"}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span>{" "}
                      {contactPhone && contactPhone !== "—" ? (
                        <a href={`tel:${contactPhone.replace(/\s+/g, "")}`} className="underline underline-offset-4">{contactPhone}</a>
                      ) : "—"}
                    </div>
                    {businessLink ? (
                      <div>
                        <span className="font-medium">Business Listing Link:</span>{" "}
                        <a href={businessLink} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                          {shortUrl(businessLink)}
                        </a>
                      </div>
                    ) : null}
                    {a.calendar_event_url ? (
                      <div>
                        <span className="font-medium">Calendar:</span>{" "}
                        <a href={a.calendar_event_url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                          Open Google Calendar event
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>

                <form action={updateAudit} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold tracking-tight">Outcome & status</div>
                    <Button type="submit" size="sm">Save</Button>
                  </div>
                  <input type="hidden" name="id" value={a.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select id="status" name="status" defaultValue={a.status ?? "scheduled"}>
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="outcome">How it went</Label>
                      <Input id="outcome" name="outcome" defaultValue={a.audit_outcome ?? ""} placeholder="Example: qualified, asked for proposal" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="calendarUrl">Google Calendar link</Label>
                    <Input id="calendarUrl" name="calendarUrl" defaultValue={a.calendar_event_url ?? ""} placeholder="https://calendar.google.com/..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" defaultValue={stripHtml(a.notes ?? "")} placeholder="What happened on the audit call?" />
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })() : null}
    </div>
  );
}
