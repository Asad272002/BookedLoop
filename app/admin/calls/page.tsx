import dayjs from "dayjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const outcomes = [
  "no_answer",
  "voicemail",
  "wrong_number",
  "not_interested",
  "callback_later",
  "interested",
  "booked_audit",
  "payment_requested",
  "paid",
  "do_not_contact",
] as const;

const outcomeLabels: Record<(typeof outcomes)[number], string> = {
  no_answer: "No answer",
  voicemail: "Voicemail",
  wrong_number: "Wrong number",
  not_interested: "Not interested",
  callback_later: "Call later",
  interested: "Interested",
  booked_audit: "Booked audit",
  payment_requested: "Payment requested",
  paid: "Paid",
  do_not_contact: "Do not contact",
};

type QueueItem = {
  id: string;
  business_name: string;
  status: string;
  next_follow_up_at: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  niche: string | null;
};

type RecentLog = {
  id: string;
  created_at: string;
  outcome: string;
  summary: string | null;
  businesses?: { business_name: string | null } | null;
};

type NoteRow = {
  id: string;
  created_at: string;
  note_text: string;
  users?: { username: string | null; full_name: string | null } | null;
};

type SelectedBusiness = {
  id: string;
  business_name: string;
  niche: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  status: string;
  lead_score: number | null;
  next_follow_up_at: string | null;
  last_contacted_at: string | null;
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const d = dayjs(value);
  if (!d.isValid()) return "";
  return d.format("YYYY-MM-DDTHH:mm");
}

function titleize(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function CallsPage({
  searchParams,
}: {
  searchParams?: Promise<{ lead?: string; status?: string }>;
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
        cookiesToSet.forEach(({ name, value, options }) => jar.set(name, value, { ...options, path: options?.path ?? "/" }));
      },
    },
  });
  const authUserId = (await supabase.auth.getUser()).data.user?.id ?? null;
  if (!authUserId) redirect("/admin/login");

  const admin = supabaseServer();
  const { data: me } = await admin.from("users").select("id, role").eq("auth_user_id", authUserId).maybeSingle();
  if (!me?.id) redirect("/admin/login");

  const baseParams = new URLSearchParams();
  if (sp.status) baseParams.set("status", sp.status);

  async function logCall(formData: FormData) {
    "use server";
    const businessId = String(formData.get("business_id") || "").trim();
    const outcomeRaw = String(formData.get("outcome") || "").trim();
    const summary = String(formData.get("summary") || "").trim();
    const duration = String(formData.get("call_duration_seconds") || "").trim();
    const followUpRequired = String(formData.get("follow_up_required") || "") === "on";
    const nextFollowUpRaw = String(formData.get("next_follow_up_at") || "").trim();
    const returnToRaw = String(formData.get("returnTo") || "").trim();

    if (!businessId || !outcomeRaw) redirect("/admin/calls?error=invalid_fields");
    try {

    const jar = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return jar.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => jar.set(name, value, { ...options, path: options?.path ?? "/" }));
        },
      },
    });
    const authUserId = (await supabase.auth.getUser()).data.user?.id ?? null;
    if (!authUserId) redirect("/admin/login");

    const admin = supabaseServer();
    const { data: me } = await admin.from("users").select("id, role").eq("auth_user_id", authUserId).maybeSingle();
    if (!me?.id) redirect("/admin/calls?error=invalid");

    const raw = outcomeRaw as (typeof outcomes)[number];
    const outcome = (raw === "payment_requested" || raw === "paid" ? "interested" : raw) as
      | "no_answer"
      | "voicemail"
      | "wrong_number"
      | "not_interested"
      | "callback_later"
      | "interested"
      | "booked_audit"
      | "do_not_contact";
    const marker =
      raw === "payment_requested"
        ? "[payment_requested]"
        : raw === "paid"
          ? "[paid]"
          : null;
    const finalSummary = marker ? (summary ? `${marker} ${summary}` : marker) : summary || null;

    if ((me.role as string | null) === "caller") {
      const { data: assignedCheck } = await admin.from("businesses").select("assigned_to_user_id").eq("id", businessId).maybeSingle();
      if (!assignedCheck?.assigned_to_user_id || assignedCheck.assigned_to_user_id !== me.id) {
        redirect("/admin/calls?error=forbidden");
      }
    }

    const next_follow_up_at = nextFollowUpRaw ? new Date(nextFollowUpRaw).toISOString() : null;
    const call_duration_seconds = duration ? Number(duration) : null;

    const durationMarker = Number.isFinite(call_duration_seconds) ? `[duration=${call_duration_seconds}s]` : null;
    const followUpMarker = followUpRequired ? "[follow_up_required]" : null;
    const summaryWithMeta = [finalSummary, durationMarker, followUpMarker].filter(Boolean).join(" ").trim() || null;

    const { error: insertErr } = await admin.from("outreach_logs").insert({
      business_id: businessId,
      user_id: me.id,
      channel: "call",
      outcome,
      summary: summaryWithMeta,
    });
    if (insertErr) redirect("/admin/calls?error=call_log_failed");

    const nextStatus =
      raw === "paid"
        ? "won"
        : outcome === "booked_audit"
        ? "audit_booked"
        : outcome === "interested"
          ? "interested"
          : outcome === "do_not_contact"
                ? "dnc"
                : outcome === "not_interested"
                  ? "lost"
                  : outcome === "callback_later" || followUpRequired
                    ? "follow_up"
                    : "contacted";

    const { error: updateErr } = await admin
      .from("businesses")
      .update({
        status: nextStatus,
        last_contacted_at: new Date().toISOString(),
        next_follow_up_at,
      })
      .eq("id", businessId);
    if (updateErr) redirect("/admin/calls?error=call_log_failed");

    const safeReturnTo = returnToRaw.startsWith("/admin/calls") ? returnToRaw : "/admin/calls";
    redirect(`${safeReturnTo}${safeReturnTo.includes("?") ? "&" : "?"}toast=call_logged`);
    } catch {
      redirect("/admin/calls?error=call_log_failed");
    }
  }

  const todayStart = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  })();

  let queueQuery = admin
    .from("businesses")
    .select("id, business_name, status, next_follow_up_at, phone, email, website, city, state, niche")
    .or("status.eq.new,status.eq.follow_up,status.eq.assigned")
    .order("next_follow_up_at", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(25);
  if (me.role === "caller") {
    queueQuery = queueQuery.eq("assigned_to_user_id", me.id);
  }
  const { data: queue } = await queueQuery;

  const recentQuery = admin
    .from("outreach_logs")
    .select("id, created_at, outcome, summary, businesses(business_name)")
    .order("created_at", { ascending: false })
    .limit(12);
  const { data: recent } = me.role === "caller" ? await recentQuery.eq("user_id", me.id) : await recentQuery;

  const queueRows = ((queue as unknown as QueueItem[] | null) ?? []).filter((r) => r?.id);
  const recentRows = ((recent as unknown as RecentLog[] | null) ?? []).filter((r) => r?.id);

  const queueIds = queueRows.map((q) => q.id);
  const { data: myTodayLogs } = await admin
    .from("outreach_logs")
    .select("id, business_id, created_at, outcome, summary")
    .eq("channel", "call")
    .eq("user_id", me.id)
    .gte("created_at", todayStart)
    .order("created_at", { ascending: false })
    .limit(200);
  const myToday = (myTodayLogs as unknown as Array<{ id: string; business_id: string; created_at: string; outcome: string; summary: string | null }> | null) ?? [];
  const completedBusinessIds = new Set(myToday.map((l) => l.business_id));
  const remainingQueue = me.role === "caller" ? queueRows.filter((q) => !completedBusinessIds.has(q.id)) : queueRows;

  const selectedLeadId = sp.lead?.trim() || null;
  const selectedLead =
    selectedLeadId && queueIds.includes(selectedLeadId)
      ? await admin
          .from("businesses")
          .select("id, business_name, niche, website, phone, email, city, state, status, lead_score, next_follow_up_at, last_contacted_at")
          .eq("id", selectedLeadId)
          .maybeSingle()
      : { data: null };
  const selected = (selectedLead as unknown as { data: SelectedBusiness | null }).data;

  const { data: selectedContacts } = selectedLeadId
    ? await admin.from("contacts").select("id, contact_name, role, phone, email").eq("business_id", selectedLeadId).order("id", { ascending: false })
    : { data: null };
  const contactRows = ((selectedContacts as unknown as Array<{ id: string; contact_name: string | null; role: string | null; phone: string | null; email: string | null }> | null) ?? []).filter((c) => c?.id);

  const { data: selectedNotes } = selectedLeadId
    ? await admin
        .from("notes")
        .select("id, created_at, note_text, users(username, full_name)")
        .eq("business_id", selectedLeadId)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: null };
  const noteRows = ((selectedNotes as unknown as NoteRow[] | null) ?? []).filter((n) => n?.id);

  const callerStats = (() => {
    const counts: Record<string, number> = {};
    let paymentRequested = 0;
    let paid = 0;
    myToday.forEach((l) => {
      counts[l.outcome] = (counts[l.outcome] || 0) + 1;
      if ((l.summary || "").includes("[payment_requested]")) paymentRequested++;
      if ((l.summary || "").includes("[paid]")) paid++;
    });
    return {
      callsDoneToday: myToday.length,
      interested: counts["interested"] || 0,
      notInterested: counts["not_interested"] || 0,
      callLater: counts["callback_later"] || 0,
      bookedAudit: counts["booked_audit"] || 0,
      paymentRequested,
      paid,
    };
  })();

  const isCaller = me.role === "caller";

  return (
    <div className="grid gap-4">
      <div className="text-lg font-semibold tracking-tight">Calls</div>
      {isCaller ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="pt-4">
              <div className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">Remaining (Today)</div>
            </CardHeader>
            <CardContent className="pt-2 text-2xl font-semibold tracking-tight">{remainingQueue.length}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pt-4">
              <div className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">Calls Done (Today)</div>
            </CardHeader>
            <CardContent className="pt-2 text-2xl font-semibold tracking-tight">{callerStats.callsDoneToday}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pt-4">
              <div className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">Interested (Today)</div>
            </CardHeader>
            <CardContent className="pt-2 text-2xl font-semibold tracking-tight">{callerStats.interested}</CardContent>
          </Card>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">{isCaller ? "Your call queue" : "Call queue"}</div>
          </CardHeader>
          <CardContent className="grid gap-2">
            {(isCaller ? remainingQueue : queueRows).length ? (
              (isCaller ? remainingQueue : queueRows).map((l) => {
                const viewParams = new URLSearchParams(baseParams);
                viewParams.set("lead", l.id);
                const viewHref = `/admin/calls?${viewParams.toString()}`;
                return (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{l.business_name}</div>
                    <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                      Status: {titleize(l.status)} · Follow-up: {l.next_follow_up_at ? dayjs(l.next_follow_up_at).format("YYYY-MM-DD HH:mm") : "—"}
                    </div>
                    <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                      {l.phone ? `Phone: ${l.phone}` : "Phone: —"} · {l.email ? `Email: ${l.email}` : "Email: —"}
                    </div>
                  </div>
                  <Button href={viewHref} variant="secondary" size="sm">
                    View
                  </Button>
                </div>
                );
              })
            ) : (
              <div className="rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                No leads in the queue.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">{isCaller ? "Log a call" : "Quick Log Call"}</div>
          </CardHeader>
          <CardContent className="grid gap-2">
            <form action={logCall} className="grid gap-2">
              <div className="grid gap-2">
                <Label htmlFor="business_id">Business</Label>
                <Select id="business_id" name="business_id" defaultValue="" required>
                  <option value="">Select…</option>
                  {(isCaller ? remainingQueue : queueRows).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.business_name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="outcome">Outcome</Label>
                <Select id="outcome" name="outcome" defaultValue="" required>
                  <option value="">Select…</option>
                  {outcomes.map((o) => (
                    <option key={o} value={o}>
                      {outcomeLabels[o]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea id="summary" name="summary" placeholder="Notes" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="call_duration_seconds">Call duration (seconds)</Label>
                <Input id="call_duration_seconds" name="call_duration_seconds" type="number" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="follow_up_required" name="follow_up_required" />
                <label htmlFor="follow_up_required" className="text-sm">
                  Follow-up required
                </label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="next_follow_up_at">Next follow-up</Label>
                <Input id="next_follow_up_at" name="next_follow_up_at" type="datetime-local" defaultValue={toDatetimeLocal(null)} />
              </div>
              <input
                type="hidden"
                name="returnTo"
                value={(() => {
                  const p = new URLSearchParams(baseParams);
                  return p.toString() ? `/admin/calls?${p.toString()}` : "/admin/calls";
                })()}
              />
              <Button variant="secondary" type="submit">
                Save Log
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold tracking-tight">Recent call logs</div>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {recentRows.length ? (
            recentRows.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2">
                <div>
                  <div className="font-medium">{r.businesses?.business_name ?? "Unknown business"}</div>
                  <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                    {titleize(r.outcome)}{r.summary ? ` · ${r.summary}` : ""}
                  </div>
                </div>
                <div className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{dayjs(r.created_at).format("YYYY-MM-DD HH:mm")}</div>
              </div>
            ))
          ) : (
            <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">No call logs yet.</div>
          )}
        </CardContent>
      </Card>

      {isCaller ? (
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Completed today</div>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {myToday.length ? (
              myToday.slice(0, 20).map((r) => {
                const name = queueRows.find((q) => q.id === r.business_id)?.business_name ?? "Lead";
                const viewParams = new URLSearchParams(baseParams);
                viewParams.set("lead", r.business_id);
                const viewHref = `/admin/calls?${viewParams.toString()}`;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2"
                  >
                    <div>
                      <div className="font-medium">{name}</div>
                      <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                        {titleize(r.outcome)}{r.summary ? ` · ${r.summary}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{dayjs(r.created_at).format("HH:mm")}</div>
                      <Button href={viewHref} variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">No completed calls today.</div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {selected && selectedLeadId ? (() => {
        const closeParams = new URLSearchParams(baseParams);
        const closeHref = closeParams.toString() ? `/admin/calls?${closeParams.toString()}` : "/admin/calls";
        const returnTo = closeHref;
        return (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] p-4">
                <div className="min-w-0">
                  <div className="text-base font-semibold tracking-tight">{selected.business_name}</div>
                  <div className="mt-1 text-xs text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                    Status: {titleize(selected.status)}
                    {selected.next_follow_up_at ? ` · Follow-up: ${dayjs(selected.next_follow_up_at).format("YYYY-MM-DD HH:mm")}` : ""}
                  </div>
                </div>
                <Button href={closeHref} variant="ghost" size="sm">
                  Close
                </Button>
              </div>
              <div className="grid gap-4 p-4">
                <div className="grid gap-2 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] p-4 text-sm">
                  <div className="grid gap-1 sm:grid-cols-2">
                    <div><span className="font-medium">Phone:</span> {selected.phone || "—"}</div>
                    <div><span className="font-medium">Email:</span> {selected.email || "—"}</div>
                    <div><span className="font-medium">Website:</span> {selected.website || "—"}</div>
                    <div><span className="font-medium">Location:</span> {[selected.city, selected.state].filter(Boolean).join(", ") || "—"}</div>
                    <div className="sm:col-span-2"><span className="font-medium">Niche:</span> {selected.niche || "—"}</div>
                  </div>
                </div>

                {contactRows.length ? (
                  <div className="grid gap-2 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] p-4">
                    <div className="text-sm font-semibold tracking-tight">Contacts</div>
                    <div className="grid gap-2 text-sm">
                      {contactRows.map((c) => (
                        <div key={c.id} className="rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_92%,transparent)] px-3 py-2">
                          <div className="font-medium">{c.contact_name || "—"}</div>
                          <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                            {c.role || "—"}{c.email ? ` · ${c.email}` : ""}{c.phone ? ` · ${c.phone}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-2 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] p-4">
                  <div className="text-sm font-semibold tracking-tight">Notes (from admin)</div>
                  {noteRows.length ? (
                    <div className="grid gap-2 text-sm">
                      {noteRows.map((n) => (
                        <div key={n.id} className="rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_92%,transparent)] px-3 py-2">
                          <div className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">
                            {n.users?.full_name ?? n.users?.username ?? "Team"} · {dayjs(n.created_at).format("YYYY-MM-DD HH:mm")}
                          </div>
                          <div className="mt-1 whitespace-pre-wrap">{n.note_text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">No notes yet.</div>
                  )}
                </div>

                <form action={logCall} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold tracking-tight">Log this call</div>
                    <Button type="submit" size="sm" variant="secondary">
                      Save
                    </Button>
                  </div>
                  <input type="hidden" name="business_id" value={selected.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="outcome_modal">Outcome</Label>
                      <Select id="outcome_modal" name="outcome" defaultValue="" required>
                        <option value="">Select…</option>
                        {outcomes.map((o) => (
                          <option key={o} value={o}>{outcomeLabels[o]}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="next_follow_up_at_modal">Next follow-up</Label>
                      <Input id="next_follow_up_at_modal" name="next_follow_up_at" type="datetime-local" defaultValue={toDatetimeLocal(selected.next_follow_up_at)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="follow_up_required_modal" name="follow_up_required" defaultChecked={selected.status === "follow_up"} />
                    <label htmlFor="follow_up_required_modal" className="text-sm">Follow-up required</label>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="summary_modal">Summary</Label>
                    <Textarea id="summary_modal" name="summary" placeholder="What happened on the call?" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="call_duration_seconds_modal">Call duration (seconds)</Label>
                    <Input id="call_duration_seconds_modal" name="call_duration_seconds" type="number" />
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
