import dayjs from "dayjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

type LeadRow = {
  id: string;
  business_name: string;
  niche: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  lead_score: number | null;
  status: string;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  assigned_to?: { username: string | null; full_name: string | null } | null;
};

const statusOptions = [
  "new",
  "assigned",
  "contacted",
  "follow_up",
  "interested",
  "audit_booked",
  "proposal_sent",
  "won",
  "lost",
  "dnc",
] as const;

function asDate(value: string | null) {
  if (!value) return "—";
  const d = dayjs(value);
  if (!d.isValid()) return value;
  return d.format("YYYY-MM-DD");
}

function parseCsv(text: string) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim().length);
  if (!lines.length) return { headers: [] as string[], rows: [] as Record<string, string>[] };

  const parseLine = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    out.push(cur);
    return out.map((v) => v.trim());
  };

  const headers = parseLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((l) => {
    const cols = parseLine(l);
    const r: Record<string, string> = {};
    headers.forEach((h, idx) => {
      r[h] = cols[idx] ?? "";
    });
    return r;
  });
  return { headers, rows };
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string; state?: string; niche?: string; ok?: string; error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const admin = supabaseServer();
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
  const { data: me } = authUserId ? await admin.from("users").select("role").eq("auth_user_id", authUserId).maybeSingle() : { data: null };
  const currentRole = (me?.role as string | null) ?? "caller";
  if (currentRole === "caller") {
    redirect("/admin/calls");
  }

  async function importCsv(formData: FormData) {
    "use server";
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
    const { data: me } = await admin.from("users").select("role").eq("auth_user_id", authUserId).maybeSingle();
    if (me?.role !== "admin") redirect("/admin/leads?error=forbidden");

    const file = formData.get("file");
    if (!file || !(file instanceof File)) redirect("/admin/leads?error=missing_file");
    const text = await file.text();
    const { rows } = parseCsv(text);
    if (!rows.length) redirect("/admin/leads?error=empty_file");

    const businesses = rows
      .map((r) => ({
        business_name: (r["business_name"] || r["business"] || r["name"] || "").trim(),
        niche: (r["niche"] || "").trim() || null,
        website: (r["website"] || "").trim() || null,
        phone: (r["phone"] || "").trim() || null,
        email: (r["email"] || "").trim() || null,
        city: (r["city"] || "").trim() || null,
        state: (r["state"] || "").trim() || null,
        status: ((r["status"] || "").trim() || "new") as string,
        lead_score: r["lead_score"] ? Number(r["lead_score"]) : null,
        next_follow_up_at: r["next_follow_up_at"] ? new Date(r["next_follow_up_at"]).toISOString() : null,
      }))
      .filter((b) => b.business_name.length);

    if (!businesses.length) redirect("/admin/leads?error=no_rows");

    const chunkSize = 200;
    for (let i = 0; i < businesses.length; i += chunkSize) {
      const chunk = businesses.slice(i, i + chunkSize);
      const { error } = await supabaseServer().from("businesses").insert(chunk);
      if (error) redirect("/admin/leads?error=import_failed");
    }

    redirect(`/admin/leads?toast=import_ok`);
  }

  const q = (sp.q ?? "").trim();
  const status = (sp.status ?? "").trim();
  const state = (sp.state ?? "").trim();
  const niche = (sp.niche ?? "").trim();

  let query = admin
    .from("businesses")
    .select(
      "id, business_name, niche, city, state, website, phone, email, lead_score, status, last_contacted_at, next_follow_up_at, created_at, assigned_to:users!businesses_assigned_to_user_id_fkey(username, full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) query = query.ilike("business_name", `%${q}%`);
  if (status) query = query.eq("status", status);
  if (state) query = query.eq("state", state.toUpperCase());
  if (niche) query = query.ilike("niche", `%${niche}%`);

  const { data: leads } = await query;
  const rows = (leads as unknown as LeadRow[] | null) ?? [];

  const exportHref = `/admin/leads/export?q=${encodeURIComponent(q)}&status=${encodeURIComponent(
    status
  )}&state=${encodeURIComponent(state)}&niche=${encodeURIComponent(niche)}`;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold tracking-tight">Leads</div>
        <div className="flex items-center gap-2">
          <Button href="/admin/leads/new" variant="secondary">
            Add Lead
          </Button>
        </div>
      </div>

      <Card className="sticky top-0 z-10">
        <CardHeader>
          <div className="text-sm font-semibold tracking-tight">Filters</div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <form className="grid gap-3 md:grid-cols-6" method="get">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="q">Search</Label>
              <Input id="q" name="q" defaultValue={q} placeholder="Business name…" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="niche">Niche</Label>
              <Input id="niche" name="niche" defaultValue={niche} placeholder="Optional" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={status}>
                <option value="">All</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" defaultValue={state} placeholder="Example: CA" />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="secondary" size="sm" type="submit">
                Apply
              </Button>
              <Button variant="ghost" size="sm" href="/admin/leads">
                Reset
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {currentRole === "admin" || currentRole === "manager" ? (
              <Button href={exportHref} variant="ghost" size="sm">
                Export CSV
              </Button>
            ) : (
              <div />
            )}
            {currentRole === "admin" ? (
              <form action={importCsv} className="flex flex-wrap items-center gap-2">
                <Input name="file" type="file" accept=".csv,text/csv" />
                <Button type="submit" variant="secondary" size="sm">
                  Import CSV
                </Button>
              </form>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]">
            <tr className="text-left">
              {[
                "Business Name",
                "Niche",
                "City",
                "State",
                "Website",
                "Phone",
                "Email",
                "Assigned To",
                "Lead Score",
                "Status",
                "Last Contacted",
                "Next Follow-Up",
                "Created At",
                "Actions",
              ].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((l) => (
                <tr key={l.id} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2">
                    <Link href={`/admin/leads/${l.id}`} className="underline underline-offset-4">
                      {l.business_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{l.niche ?? "—"}</td>
                  <td className="px-3 py-2">{l.city ?? "—"}</td>
                  <td className="px-3 py-2">{l.state ?? "—"}</td>
                  <td className="px-3 py-2">{l.website ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{l.phone ?? "—"}</td>
                  <td className="px-3 py-2">{l.email ?? "—"}</td>
                  <td className="px-3 py-2">{l.assigned_to?.full_name ?? l.assigned_to?.username ?? "—"}</td>
                  <td className="px-3 py-2">{l.lead_score ?? "—"}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-3 py-2">{asDate(l.last_contacted_at)}</td>
                  <td className="px-3 py-2">{asDate(l.next_follow_up_at)}</td>
                  <td className="px-3 py-2">{asDate(l.created_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button href={`/admin/leads/${l.id}`} variant="secondary" size="sm">
                        View
                      </Button>
                      <Button href={`/admin/leads/${l.id}/edit`} variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-8 text-center text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]" colSpan={14}>
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
