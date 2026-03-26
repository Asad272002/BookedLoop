import dayjs from "dayjs";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  total: number | null;
  payment_status: string | null;
  created_at: string;
  businesses?: { business_name: string | null } | null;
};

export default async function InvoicesPage() {
  const admin = supabaseServer();
  const { data } = await admin
    .from("invoices")
    .select("id, invoice_number, invoice_date, due_date, total, payment_status, created_at, businesses(business_name)")
    .order("created_at", { ascending: false })
    .limit(25);
  const rows = (data as unknown as InvoiceRow[] | null) ?? [];
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold tracking-tight">Invoices</div>
        <Button href="/admin/invoices" variant="secondary">
          Create Invoice
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Recent invoices</div>
          </CardHeader>
          <CardContent className="grid gap-2">
            {rows.length ? (
              rows.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{inv.invoice_number ?? `Invoice ${inv.id.slice(0, 8)}`}</div>
                    <div className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                      {inv.businesses?.business_name ?? "Unknown business"} — {inv.payment_status ?? "draft"} · {inv.total ? `$${inv.total.toFixed(2)}` : "—"} · {dayjs(inv.created_at).format("YYYY-MM-DD")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link className="rounded-md border border-[var(--border)] px-3 py-1 text-sm hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]" href="/admin/invoices">
                      View
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-3 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                No invoices yet.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Next</div>
          </CardHeader>
          <CardContent className="text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
            Create invoices from a proposal and export PDF is the next step.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
