import dayjs from "dayjs";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const statusOptions = [
  "new",
  "assigned",
  "contacted",
  "follow_up",
  "interested",
  "audit_booked",
  "proposal_sent",
  "payment_pending",
  "won",
  "lost",
  "dnc",
] as const;

type InternalUserLite = {
  id: string;
  username: string | null;
  full_name: string | null;
  role: string | null;
  is_active: boolean;
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const d = dayjs(value);
  if (!d.isValid()) return "";
  return d.format("YYYY-MM-DDTHH:mm");
}

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = supabaseServer();

  {
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
    const { data: me } = await admin.from("users").select("role").eq("auth_user_id", authUserId).maybeSingle();
    if (!me || (me.role !== "admin" && me.role !== "manager")) redirect("/admin/leads?error=forbidden");
  }

  const { data: lead } = await admin
    .from("businesses")
    .select(
      "id, business_name, niche, website, phone, email, city, state, status, lead_score, assigned_to_user_id, next_follow_up_at, last_contacted_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!lead) redirect("/admin/leads");

  const { data: users } = await admin
    .from("users")
    .select("id, username, full_name, role, is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  const userRows = (users as unknown as InternalUserLite[] | null) ?? [];

  async function updateLead(formData: FormData) {
    "use server";
    const business_name = String(formData.get("business_name") || "").trim();
    const niche = String(formData.get("niche") || "").trim();
    const website = String(formData.get("website") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const state = String(formData.get("state") || "").trim();
    const status = String(formData.get("status") || "").trim();
    const assignedTo = String(formData.get("assigned_to_user_id") || "").trim();
    const leadScoreRaw = String(formData.get("lead_score") || "").trim();
    const nextFollowUpRaw = String(formData.get("next_follow_up_at") || "").trim();
    const note = String(formData.get("note") || "").trim();

    if (!business_name) redirect(`/admin/leads/${id}/edit`);

    const lead_score = leadScoreRaw ? Number(leadScoreRaw) : null;
    const next_follow_up_at = nextFollowUpRaw ? new Date(nextFollowUpRaw).toISOString() : null;

    const admin = supabaseServer();
    await admin
      .from("businesses")
      .update({
        business_name,
        niche: niche || null,
        website: website || null,
        phone: phone || null,
        email: email || null,
        city: city || null,
        state: state ? state.toUpperCase() : null,
        status: status || null,
        assigned_to_user_id: assignedTo || null,
        lead_score: Number.isFinite(lead_score) ? lead_score : null,
        next_follow_up_at,
      })
      .eq("id", id);

    if (note) {
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
      const { data: me } = authUserId
        ? await admin.from("users").select("id").eq("auth_user_id", authUserId).maybeSingle()
        : { data: null };
      if (me?.id) await admin.from("notes").insert({ business_id: id, user_id: me.id, note_text: note });
    }

    redirect(`/admin/leads/${id}?toast=lead_updated`);
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold tracking-tight">Edit lead</div>
        <Button href={`/admin/leads/${id}`} variant="ghost">
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold tracking-tight">Lead details</div>
        </CardHeader>
        <CardContent>
          <form action={updateLead} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="business_name">Business name</Label>
                <Input id="business_name" name="business_name" defaultValue={lead.business_name ?? ""} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="niche">Niche</Label>
                <Input id="niche" name="niche" defaultValue={lead.niche ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" defaultValue={lead.website ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={lead.phone ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={lead.email ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" defaultValue={lead.city ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" defaultValue={lead.state ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead_score">Lead score</Label>
                <Input id="lead_score" name="lead_score" type="number" defaultValue={lead.lead_score ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" defaultValue={lead.status ?? "new"}>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assigned_to_user_id">Assigned to</Label>
                <Select id="assigned_to_user_id" name="assigned_to_user_id" defaultValue={lead.assigned_to_user_id ?? ""}>
                  <option value="">Unassigned</option>
                  {userRows.map((u) => (
                    <option key={u.id} value={u.id}>
                      {(u.full_name ?? u.username) || u.id} ({u.role})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="next_follow_up_at">Next follow-up</Label>
                <Input id="next_follow_up_at" name="next_follow_up_at" type="datetime-local" defaultValue={toDatetimeLocal(lead.next_follow_up_at)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Add note (optional)</Label>
              <Textarea id="note" name="note" placeholder="Internal note" />
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="secondary">
                Save changes
              </Button>
              <Button href={`/admin/leads/${id}`} variant="ghost">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
