import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const leadSchema = z.object({
  business_name: z.string().min(2).max(160),
  niche: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  lead_score: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export default function NewLeadPage() {
  async function createLead(formData: FormData) {
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
          cookiesToSet.forEach(({ name, value, options }) => jar.set(name, value, options));
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/admin/login");

    const parsed = leadSchema.safeParse({
      business_name: String(formData.get("business_name") || "").trim(),
      niche: String(formData.get("niche") || "").trim(),
      website: String(formData.get("website") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      state: String(formData.get("state") || "").trim(),
      lead_score: String(formData.get("lead_score") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
    });

    if (!parsed.success) redirect("/admin/leads/new");

    const v = parsed.data;
    const leadScore = v.lead_score ? Number(v.lead_score) : null;

    const admin = supabaseServer();
    const { data: me } = await admin.from("users").select("id, role").eq("auth_user_id", user.id).maybeSingle();
    if (!me?.id || (me.role !== "admin" && me.role !== "manager")) redirect("/admin/leads");
    const { data: biz, error } = await admin
      .from("businesses")
      .insert({
        business_name: v.business_name,
        niche: v.niche || null,
        website: v.website || null,
        phone: v.phone || null,
        email: v.email || null,
        city: v.city || null,
        state: v.state ? v.state.toUpperCase() : null,
        lead_score: Number.isFinite(leadScore) ? leadScore : null,
        status: "new",
      })
      .select("id")
      .single();

    if (error || !biz?.id) redirect("/admin/leads/new");

    if (v.notes) {
      if (me?.id) {
        await admin.from("notes").insert({
          business_id: biz.id,
          user_id: me.id,
          note_text: v.notes,
        });
      }
    }

    redirect(`/admin/leads/${biz.id}`);
  }

  return (
    <form className="grid gap-6" action={createLead}>
      <div className="text-lg font-semibold tracking-tight">Add Lead</div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="business_name">Business Name</Label>
          <Input id="business_name" name="business_name" required minLength={2} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="niche">Niche</Label>
          <Select id="niche" name="niche" defaultValue="">
            <option value="">Select…</option>
            <option>plumbing</option>
            <option>detailing</option>
            <option>dental</option>
            <option>salon</option>
            <option>HVAC</option>
            <option>electrical</option>
            <option>tutoring</option>
            <option>auto repair</option>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" placeholder="https://..." />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lead_score">Lead Score</Label>
          <Input id="lead_score" name="lead_score" type="number" />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Internal notes" />
      </div>

      <div>
        <Button variant="secondary" type="submit">
          Save Lead
        </Button>
      </div>
    </form>
  );
}
