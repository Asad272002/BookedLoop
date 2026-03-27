import dayjs from "dayjs";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { supabaseServer } from "@/lib/supabase/server";

type RecentActivityItem = {
  t: string;
  d: string;
  at: string;
};

type OutreachLogRow = {
  created_at: string;
  outcome: string;
  summary: string | null;
  businesses?: { business_name: string | null } | null;
  users?: { username: string | null; full_name: string | null } | null;
};

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function AdminOverview() {
  const admin = supabaseServer();
  const todayStart = startOfTodayIso();

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
  const { data: me } = await admin.from("users").select("id, role").eq("auth_user_id", authUserId).maybeSingle();
  if (!me?.id) redirect("/admin/login");

  if (me.role === "caller") {
    const { data: queue } = await admin
      .from("businesses")
      .select("id")
      .eq("assigned_to_user_id", me.id)
      .or("status.eq.new,status.eq.follow_up,status.eq.assigned");

    const { data: logs } = await admin
      .from("outreach_logs")
      .select("id, created_at, outcome, business_id")
      .eq("channel", "call")
      .eq("user_id", me.id)
      .gte("created_at", todayStart)
      .order("created_at", { ascending: false })
      .limit(500);

    const logRows = (logs as unknown as Array<{ id: string; created_at: string; outcome: string; business_id: string }> | null) ?? [];
    const doneIds = new Set(logRows.map((l) => l.business_id));
    const queueCount = ((queue as unknown as Array<{ id: string }> | null) ?? []).length;
    const remaining = Math.max(0, queueCount - doneIds.size);

    const counts: Record<string, number> = {};
    logRows.forEach((l) => {
      counts[l.outcome] = (counts[l.outcome] || 0) + 1;
    });

    const kpis = [
      { label: "Remaining (Today)", value: remaining },
      { label: "Calls Done (Today)", value: logRows.length },
      { label: "Interested (Today)", value: counts["interested"] || 0 },
      { label: "Not Interested (Today)", value: counts["not_interested"] || 0 },
      { label: "Booked Audits (Today)", value: counts["booked_audit"] || 0 },
    ];

    return (
      <div className="grid gap-4">
        <div className="text-lg font-semibold tracking-tight">Caller Dashboard</div>
        <div className="grid gap-3 md:grid-cols-5">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardHeader className="pt-4">
                <div className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">{k.label}</div>
              </CardHeader>
              <CardContent className="pt-2 text-2xl font-semibold tracking-tight">{k.value}</CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-2">
          <Link
            href="/admin/calls"
            className="rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-3 text-sm hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]"
          >
            Go to Calls
          </Link>
        </div>
      </div>
    );
  }

  const [{ count: totalLeads }, { count: newLeads }, { count: callsToday }, { count: followUpsDue }, { count: interested }, { count: auditsBooked }, { count: proposalsSent }, { count: won }, { count: lost }] =
    await Promise.all([
      admin.from("businesses").select("id", { count: "exact", head: true }),
      admin.from("businesses").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
      admin.from("outreach_logs").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
      admin.from("businesses").select("id", { count: "exact", head: true }).not("next_follow_up_at", "is", null).lte("next_follow_up_at", new Date().toISOString()),
      admin.from("businesses").select("id", { count: "exact", head: true }).eq("status", "interested"),
      admin.from("businesses").select("id", { count: "exact", head: true }).eq("status", "audit_booked"),
      admin.from("proposals").select("id", { count: "exact", head: true }).eq("status", "sent"),
      admin.from("businesses").select("id", { count: "exact", head: true }).eq("status", "won"),
      admin.from("businesses").select("id", { count: "exact", head: true }).eq("status", "lost"),
    ]);

  const conversionRate = (() => {
    const denom = (won ?? 0) + (lost ?? 0);
    if (!denom) return "—";
    return `${Math.round(((won ?? 0) / denom) * 100)}%`;
  })();

  const { data: logs } = await admin
    .from("outreach_logs")
    .select("created_at, outcome, summary, businesses(business_name), users(username, full_name)")
    .order("created_at", { ascending: false })
    .limit(8);

  const activity: RecentActivityItem[] =
    (logs as unknown as OutreachLogRow[] | null)?.map((l) => {
      const businessName = l.businesses?.business_name ?? "Unknown business";
      const who = l.users?.full_name ?? l.users?.username ?? "Team";
      return {
        t: "Call logged",
        d: `${businessName} — ${l.outcome}${l.summary ? ` · ${l.summary}` : ""} · by ${who}`,
        at: l.created_at,
      };
    }) ?? [];

  const kpis = [
    { label: "Total Leads", value: totalLeads ?? 0 },
    { label: "New Leads (Today)", value: newLeads ?? 0 },
    { label: "Calls Made Today", value: callsToday ?? 0 },
    { label: "Follow-Ups Due", value: followUpsDue ?? 0 },
    { label: "Interested Leads", value: interested ?? 0 },
    { label: "Audits Booked", value: auditsBooked ?? 0 },
    { label: "Proposals Sent", value: proposalsSent ?? 0 },
    { label: "Won Clients", value: won ?? 0 },
    { label: "Lost Leads", value: lost ?? 0 },
    { label: "Conversion Rate", value: conversionRate },
  ];

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pt-4">
              <div className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">{k.label}</div>
            </CardHeader>
            <CardContent className="pt-2 text-2xl font-semibold tracking-tight">{k.value}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Recent activity</div>
          </CardHeader>
          <CardContent className="grid gap-2">
            {activity.length ? (
              activity.map((a, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{a.t}</div>
                    <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">{a.d}</div>
                  </div>
                  <div className="text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{dayjs(a.at).format("YYYY-MM-DD HH:mm")}</div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2 text-sm">
                <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">No activity yet.</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Quick actions</div>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              { href: "/admin/leads/new", label: "Add Lead" },
              { href: "/admin/leads", label: "Import Leads" },
              { href: "/admin/leads", label: "Export Leads" },
              { href: "/admin/proposals", label: "Create Proposal" },
              { href: "/admin/invoices", label: "Generate Invoice" },
            ].map((a) => (
              <Link
                key={a.href + a.label}
                href={a.href}
                className="rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2 text-left text-sm hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]"
              >
                {a.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
