import dayjs from "dayjs";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Label, Textarea } from "@/components/ui/Field";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function formatWhen(value: string | null) {
  if (!value) return "—";
  const d = dayjs(value);
  if (!d.isValid()) return value;
  return d.format("YYYY-MM-DD HH:mm");
}

type Business = {
  id: string;
  business_name: string;
  niche: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  status: string;
  lead_score: number | null;
  next_follow_up_at: string | null;
  last_contacted_at: string | null;
  created_at: string;
};

type ContactRow = {
  id: string;
  contact_name: string | null;
  role: string | null;
  phone: string | null;
  email: string | null;
};

type OutreachRow = {
  id: string;
  created_at: string;
  channel: string;
  outcome: string;
  summary: string | null;
  users?: { username: string | null; full_name: string | null } | null;
};

type AuditRow = {
  id: string;
  appointment_datetime: string | null;
  timezone: string | null;
  status: string | null;
  calendar_event_url?: string | null;
  notes: string | null;
  audit_outcome?: string | null;
};

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const admin = supabaseServer();

  const { data: business } = await admin
    .from("businesses")
    .select("id, business_name, niche, city, state, phone, email, website, status, lead_score, next_follow_up_at, last_contacted_at, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!business) {
    redirect("/admin/leads");
  }

  const { data: contacts } = await admin
    .from("contacts")
    .select("id, contact_name, role, phone, email")
    .eq("business_id", id)
    .order("id", { ascending: false });
  const contactRows = (contacts as unknown as ContactRow[] | null) ?? [];

  const { data: outreach } = await admin
    .from("outreach_logs")
    .select("id, created_at, channel, outcome, summary, users(username, full_name)")
    .eq("business_id", id)
    .order("created_at", { ascending: false })
    .limit(20);
  const outreachRows = (outreach as unknown as OutreachRow[] | null) ?? [];

  const { data: audits } = await admin
    .from("appointments")
    .select("id, appointment_datetime, timezone, status, calendar_event_url, notes, audit_outcome")
    .eq("business_id", id)
    .eq("appointment_type", "audit")
    .order("appointment_datetime", { ascending: false })
    .limit(10);
  const auditRows = (audits as unknown as AuditRow[] | null) ?? [];

  const jar = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return jar.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => jar.set(name, value, options));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = user ? await admin.from("users").select("id").eq("auth_user_id", user.id).maybeSingle() : { data: null };

  async function addNote(formData: FormData) {
    "use server";
    const note = String(formData.get("note") || "").trim();
    if (!note) redirect(`/admin/leads/${id}`);
    const jar = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return jar.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => jar.set(name, value, options));
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/admin/login");
    const admin = supabaseServer();
    const { data: me } = await admin.from("users").select("id").eq("auth_user_id", user.id).maybeSingle();
    if (!me?.id) redirect(`/admin/leads/${id}`);
    await admin.from("notes").insert({ business_id: id, user_id: me.id, note_text: note });
    redirect(`/admin/leads/${id}`);
  }

  const lead = business as unknown as Business;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="grid gap-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold tracking-tight">Business overview</div>
              <div className="flex items-center gap-2">
                <Button href={`/admin/leads/${id}/edit`} variant="secondary" size="sm">
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div>Business: {lead.business_name}</div>
            <div>Niche: {lead.niche ?? "—"}</div>
            <div>Location: {(lead.city ?? "—")}{lead.state ? `, ${lead.state}` : ""}</div>
            <div>Phone: {lead.phone ?? "—"}</div>
            <div>Email: {lead.email ?? "—"}</div>
            <div>
              Website:{" "}
              {lead.website ? (
                <a className="underline underline-offset-4" href={lead.website} target="_blank" rel="noreferrer">
                  Open
                </a>
              ) : (
                "No website"
              )}
            </div>
            <div>Status: {lead.status}</div>
            <div>Lead score: {lead.lead_score ?? "—"}</div>
            <div>Last contacted: {formatWhen(lead.last_contacted_at)}</div>
            <div>Next follow-up: {formatWhen(lead.next_follow_up_at)}</div>
            <div>Created: {formatWhen(lead.created_at)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Contacts</div>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {contactRows.length ? (
              contactRows.map((c) => (
                <div key={c.id} className="rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2">
                  <div className="font-medium">{c.contact_name || "—"}</div>
                  <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                    {c.role || "—"}{c.email ? ` · ${c.email}` : ""}{c.phone ? ` · ${c.phone}` : ""}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">No contacts yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Outreach history</div>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {outreachRows.length ? (
              outreachRows.map((o) => (
                <div key={o.id} className="rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{o.outcome}</div>
                    <div className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{formatWhen(o.created_at)}</div>
                  </div>
                  <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                    {o.channel}{o.summary ? ` · ${o.summary}` : ""}{o.users?.full_name || o.users?.username ? ` · by ${o.users?.full_name ?? o.users?.username}` : ""}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">No outreach logged yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Audit calls</div>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {auditRows.length ? (
              auditRows.map((a) => (
                <div key={a.id} className="rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{a.status}</div>
                    <div className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
                      {formatWhen(a.appointment_datetime)} {a.timezone ? `(${a.timezone})` : ""}
                    </div>
                  </div>
                  {a.calendar_event_url ? (
                    <div className="mt-1 text-xs">
                      <a className="underline underline-offset-4" href={a.calendar_event_url} target="_blank" rel="noreferrer">
                        Open calendar event
                      </a>
                    </div>
                  ) : null}
                  {a.audit_outcome ? (
                    <div className="mt-1 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">Outcome: {a.audit_outcome}</div>
                  ) : null}
                  {a.notes ? (
                    <div className="mt-1 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">{a.notes}</div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">No audits yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Notes</div>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <form action={addNote} className="grid gap-2">
              <Label htmlFor="note">Add a note</Label>
              <Textarea id="note" name="note" placeholder="Internal note" />
              <div>
                <Button variant="secondary" type="submit" disabled={!me?.id}>
                  Add Note
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Quick actions</div>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button href={`/admin/leads/${id}/edit`} variant="secondary">
              Edit lead
            </Button>
            <Button href={`/admin/audits`} variant="ghost">
              View audits
            </Button>
            <Button href={`/admin/calls`} variant="ghost">
              Log call
            </Button>
            <Link
              href="/admin/proposals"
              className="rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2 text-sm hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]"
            >
              Create proposal
            </Link>
            <Link
              href="/admin/invoices"
              className="rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2 text-sm hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]"
            >
              Create invoice
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
