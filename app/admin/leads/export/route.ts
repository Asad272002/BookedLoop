import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ExportRow = {
  business_name: string | null;
  niche: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
  lead_score: number | null;
  created_at: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
};

function csvEscape(value: unknown) {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: Request) {
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
  if (!authUserId) return new NextResponse("Unauthorized", { status: 401 });

  const admin = supabaseServer();
  const { data: me } = await admin
    .from("users")
    .select("role")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (me?.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const status = (url.searchParams.get("status") ?? "").trim();
  const state = (url.searchParams.get("state") ?? "").trim();
  const niche = (url.searchParams.get("niche") ?? "").trim();

  let query = admin
    .from("businesses")
    .select("id, business_name, niche, website, phone, email, city, state, status, lead_score, created_at, last_contacted_at, next_follow_up_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (q) query = query.ilike("business_name", `%${q}%`);
  if (status) query = query.eq("status", status);
  if (state) query = query.eq("state", state.toUpperCase());
  if (niche) query = query.ilike("niche", `%${niche}%`);

  const { data: rows } = await query;

  const header = [
    "business_name",
    "niche",
    "website",
    "phone",
    "email",
    "city",
    "state",
    "status",
    "lead_score",
    "created_at",
    "last_contacted_at",
    "next_follow_up_at",
  ];

  const csv =
    header.join(",") +
    "\n" +
    ((rows as unknown as ExportRow[] | null) ?? [])
      .map((r) =>
        [
          r.business_name,
          r.niche,
          r.website,
          r.phone,
          r.email,
          r.city,
          r.state,
          r.status,
          r.lead_score,
          r.created_at,
          r.last_contacted_at,
          r.next_follow_up_at,
        ]
          .map(csvEscape)
          .join(",")
      )
      .join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="bookedloop-leads.csv"`,
      "cache-control": "no-store",
    },
  });
}
