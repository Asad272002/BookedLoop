import dayjs from "dayjs";
import Link from "next/link";

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
