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

export default async function AuditsPage() {
  const jar = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return jar.getAll().map(({ name, value }) => ({ name, value }));
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

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold tracking-tight">Audits</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Scheduled & completed audits</div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {!rows?.length ? (
              <div className="rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-3 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                No audits logged yet.
              </div>
            ) : null}

            {rows?.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold tracking-tight">
                      {a.business?.business_name || "Unknown business"}
                    </div>
                    <div className="mt-1 text-xs text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                      When: {formatWhen(a.appointment_datetime)} ({a.timezone || "—"}) · Status: {a.status || "—"}
                    </div>
                    {a.calendar_event_url ? (
                      <div className="mt-1 text-xs">
                        <a
                          className="underline underline-offset-4"
                          href={a.calendar_event_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Google Calendar event
                        </a>
                      </div>
                    ) : null}
                    {a.contact?.contact_name || a.contact?.email || a.contact?.phone ? (
                      <div className="mt-2 text-xs text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                        Contact: {a.contact?.contact_name || "—"}
                        {a.contact?.email ? ` · ${a.contact.email}` : ""}
                        {a.contact?.phone ? ` · ${a.contact.phone}` : ""}
                      </div>
                    ) : null}
                  </div>
                </div>

                <form action={updateAudit} className="mt-4 grid gap-3">
                  <input type="hidden" name="id" value={a.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor={`status-${a.id}`}>Status</Label>
                      <Select id={`status-${a.id}`} name="status" defaultValue={a.status ?? "scheduled"}>
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`outcome-${a.id}`}>How it went</Label>
                      <Input
                        id={`outcome-${a.id}`}
                        name="outcome"
                        defaultValue={a.audit_outcome ?? ""}
                        placeholder="Example: qualified, asked for proposal"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`calendarUrl-${a.id}`}>Google Calendar link</Label>
                    <Input
                      id={`calendarUrl-${a.id}`}
                      name="calendarUrl"
                      defaultValue={a.calendar_event_url ?? ""}
                      placeholder="https://calendar.google.com/..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`notes-${a.id}`}>Notes</Label>
                    <Textarea
                      id={`notes-${a.id}`}
                      name="notes"
                      defaultValue={a.notes ?? ""}
                      placeholder="What happened on the audit call?"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" size="sm">
                      Save
                    </Button>
                  </div>
                </form>
              </div>
            ))}
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
    </div>
  );
}
