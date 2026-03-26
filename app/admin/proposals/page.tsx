import dayjs from "dayjs";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ProposalRow = {
  id: string;
  proposal_number: string | null;
  title: string | null;
  status: string | null;
  total_amount: number | null;
  created_at: string;
  businesses?: { business_name: string | null } | null;
};

export default async function ProposalsPage() {
  const admin = supabaseServer();
  const { data } = await admin
    .from("proposals")
    .select("id, proposal_number, title, status, total_amount, created_at, businesses(business_name)")
    .order("created_at", { ascending: false })
    .limit(25);

  const rows = (data as unknown as ProposalRow[] | null) ?? [];
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold tracking-tight">Proposals</div>
        <Button href="/admin/proposals" variant="secondary">
          Create Proposal
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Recent proposals</div>
          </CardHeader>
          <CardContent className="grid gap-2">
            {rows.length ? (
              rows.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{p.proposal_number ?? `Proposal ${p.id.slice(0, 8)}`}</div>
                    <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                      {p.businesses?.business_name ?? "Unknown business"} — {p.status ?? "draft"} · {p.total_amount ? `$${p.total_amount.toFixed(2)}` : "—"} · {dayjs(p.created_at).format("YYYY-MM-DD")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link className="rounded-md border border-[var(--border)] px-3 py-1 text-sm hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]" href="/admin/proposals">
                      View
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-3 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                No proposals yet.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Next</div>
          </CardHeader>
          <CardContent className="text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
            Create proposals from a lead and export PDF is the next step.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
