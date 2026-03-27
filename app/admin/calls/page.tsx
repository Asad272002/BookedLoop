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
  "do_not_contact",
] as const;

type QueueItem = {
  id: string;
  business_name: string;
  status: string;
  next_follow_up_at: string | null;
};

type RecentLog = {
  id: string;
  created_at: string;
  outcome: string;
  summary: string | null;
  businesses?: { business_name: string | null } | null;
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const d = dayjs(value);
  if (!d.isValid()) return "";
  return d.format("YYYY-MM-DDTHH:mm");
}

export default async function CallsPage({
  searchParams,
}: {
  searchParams?: Promise<{ ok?: string; error?: string }>;
}) {
  await searchParams;
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
  const isProd = process.env.NODE_ENV === "production";
  const authUserId = isProd
    ? (await supabase.auth.getSession()).data.session?.user.id ?? null
    : (await supabase.auth.getUser()).data.user?.id ?? null;
  if (!authUserId) redirect("/admin/login");

  const admin = supabaseServer();
  const { data: me } = await admin.from("users").select("id, role").eq("auth_user_id", authUserId).maybeSingle();
  if (!me?.id) redirect("/admin/login");

  async function logCall(formData: FormData) {
    "use server";
    const businessId = String(formData.get("business_id") || "").trim();
    const outcome = String(formData.get("outcome") || "").trim();
    const summary = String(formData.get("summary") || "").trim();
    const duration = String(formData.get("call_duration_seconds") || "").trim();
    const followUpRequired = String(formData.get("follow_up_required") || "") === "on";
    const nextFollowUpRaw = String(formData.get("next_follow_up_at") || "").trim();

    if (!businessId || !outcome) redirect("/admin/calls?error=invalid");

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
    const isProd = process.env.NODE_ENV === "production";
    const authUserId = isProd
      ? (await supabase.auth.getSession()).data.session?.user.id ?? null
      : (await supabase.auth.getUser()).data.user?.id ?? null;
    if (!authUserId) redirect("/admin/login");

    const admin = supabaseServer();
    const { data: me } = await admin.from("users").select("id").eq("auth_user_id", authUserId).maybeSingle();
    if (!me?.id) redirect("/admin/calls?error=invalid");

    const next_follow_up_at = nextFollowUpRaw ? new Date(nextFollowUpRaw).toISOString() : null;
    const call_duration_seconds = duration ? Number(duration) : null;

    const { error: insertErr } = await admin.from("outreach_logs").insert({
      business_id: businessId,
      user_id: me.id,
      channel: "call",
      outcome,
      summary: summary || null,
      call_duration_seconds: Number.isFinite(call_duration_seconds) ? call_duration_seconds : null,
      follow_up_required: followUpRequired,
      next_action_at: next_follow_up_at,
    });
    if (insertErr) redirect("/admin/calls?error=call_log_failed");

    const nextStatus =
      outcome === "booked_audit"
        ? "audit_booked"
        : outcome === "interested"
          ? "interested"
          : outcome === "do_not_contact"
            ? "dnc"
            : outcome === "not_interested"
              ? "lost"
              : followUpRequired
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

    redirect("/admin/calls?toast=call_logged");
  }

  let queueQuery = admin
    .from("businesses")
    .select("id, business_name, status, next_follow_up_at")
    .or("status.eq.new,status.eq.follow_up,status.eq.assigned")
    .order("next_follow_up_at", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(25);
  if (me.role === "caller") {
    queueQuery = queueQuery.eq("assigned_to_user_id", me.id);
  }
  const { data: queue } = await queueQuery;

  const { data: recent } = await admin
    .from("outreach_logs")
    .select("id, created_at, outcome, summary, businesses(business_name)")
    .order("created_at", { ascending: false })
    .limit(12);

  const queueRows = ((queue as unknown as QueueItem[] | null) ?? []).filter((r) => r?.id);
  const recentRows = ((recent as unknown as RecentLog[] | null) ?? []).filter((r) => r?.id);

  return (
    <div className="grid gap-4">
      <div className="text-lg font-semibold tracking-tight">Calls</div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Call queue</div>
          </CardHeader>
          <CardContent className="grid gap-2">
            {queueRows.length ? (
              queueRows.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{l.business_name}</div>
                    <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                      Status: {l.status} · Follow-up: {l.next_follow_up_at ? dayjs(l.next_follow_up_at).format("YYYY-MM-DD HH:mm") : "—"}
                    </div>
                  </div>
                  <Button href={`/admin/leads/${l.id}`} variant="secondary" size="sm">
                    View
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                No leads in the queue.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Quick Log Call</div>
          </CardHeader>
          <CardContent className="grid gap-2">
            <form action={logCall} className="grid gap-2">
              <div className="grid gap-2">
                <Label htmlFor="business_id">Business</Label>
                <Select id="business_id" name="business_id" defaultValue="">
                  <option value="">Select…</option>
                  {queueRows.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.business_name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="outcome">Outcome</Label>
                <Select id="outcome" name="outcome" defaultValue="">
                  <option value="">Select…</option>
                  {outcomes.map((o) => (
                    <option key={o} value={o}>
                      {o}
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
                    {r.outcome}{r.summary ? ` · ${r.summary}` : ""}
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
    </div>
  );
}
