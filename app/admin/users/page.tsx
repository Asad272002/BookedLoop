import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const createUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, underscores, or dashes only."),
  fullName: z.string().min(2).max(80),
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(["admin", "manager", "caller"]),
  password: z.string().min(8).max(72),
});

type InternalUser = {
  id: string;
  auth_user_id: string | null;
  username: string;
  full_name: string;
  email: string;
  role: "admin" | "manager" | "caller";
  is_active: boolean;
  created_at: string;
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ ok?: string; error?: string }>;
}) {
  const jar = await cookies();
  const sp = (await searchParams) ?? {};
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return jar.getAll().map(({ name, value }) => ({ name, value }));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = (user?.app_metadata?.role as string | undefined) ?? "caller";
  if (role !== "admin") redirect("/admin");

  async function createUser(formData: FormData) {
    "use server";
    const parsed = createUserSchema.safeParse({
      username: String(formData.get("username") || "").trim(),
      fullName: String(formData.get("fullName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      role: String(formData.get("role") || "caller").trim(),
      password: String(formData.get("password") || ""),
    });

    if (!parsed.success) {
      redirect("/admin/users?error=invalid_fields");
    }

    const { username, fullName, email, role, password } = parsed.data;
    const finalEmail = email || `${username.toLowerCase()}@bookedloop.internal`;

    const admin = supabaseServer();
    const { data: existingUsername } = await admin
      .from("users")
      .select("auth_user_id")
      .eq("username", username)
      .maybeSingle();
    if (existingUsername?.auth_user_id) {
      redirect("/admin/users?error=username_taken");
    }

    const { data: existingEmail } = await admin
      .from("users")
      .select("username")
      .ilike("email", finalEmail)
      .maybeSingle();
    if (existingEmail?.username && existingEmail.username !== username) {
      redirect("/admin/users?error=email_taken");
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: finalEmail,
      password,
      email_confirm: true,
      user_metadata: { username, full_name: fullName },
      app_metadata: { role },
    });

    let authUserId = data.user?.id ?? null;
    if ((error || !authUserId) && finalEmail) {
      let existingId: string | null = null;
      for (let page = 1; page <= 20; page++) {
        const { data: listed, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (listErr) break;
        const found = listed.users.find((u) => (u.email || "").toLowerCase() === finalEmail.toLowerCase());
        if (found?.id) {
          existingId = found.id;
          break;
        }
        if (!listed.users.length) break;
      }

      if (existingId) {
        authUserId = existingId;
        const { error: updateErr } = await admin.auth.admin.updateUserById(authUserId, {
          password,
          user_metadata: { username, full_name: fullName },
          app_metadata: { role },
        });
        if (updateErr) redirect("/admin/users?error=create_failed");
      }
    }

    if (!authUserId) {
      const msg = (error as { message?: string } | null)?.message ?? "";
      if (msg.toLowerCase().includes("password")) redirect("/admin/users?error=weak_password");
      if (msg.toLowerCase().includes("database error creating new user")) redirect("/admin/users?error=auth_db_error");
      redirect("/admin/users?error=create_failed");
    }

    const fullRow = {
      auth_user_id: authUserId,
      username,
      full_name: fullName,
      email: finalEmail,
      role,
      is_active: true,
    };

    const { data: upserted, error: upsertErr } = await admin
      .from("users")
      .upsert(fullRow, { onConflict: "username" })
      .select("id")
      .maybeSingle();

    if (upsertErr) {
      const msg = upsertErr.message.toLowerCase();
      const missingUnique =
        msg.includes("no unique or exclusion constraint") || (msg.includes("on conflict") && msg.includes("constraint"));

      if (missingUnique) {
        const { data: inserted, error: insertErr } = await admin
          .from("users")
          .insert(fullRow)
          .select("id")
          .maybeSingle();

        if (!insertErr && inserted?.id) {
          redirect("/admin/users?ok=1");
        }

        const { data: updated, error: updateErr } = await admin
          .from("users")
          .update(fullRow)
          .eq("username", username)
          .select("id")
          .maybeSingle();

        if (!updateErr && updated?.id) {
          redirect("/admin/users?ok=1");
        }
      }

      redirect("/admin/users?error=db_write_failed");
    }

    let createdId = upserted?.id ?? null;
    if (!createdId) {
      const { data: verify } = await admin
        .from("users")
        .select("id")
        .or(`auth_user_id.eq.${authUserId},username.eq.${username}`)
        .maybeSingle();
      createdId = verify?.id ?? null;
    }
    if (!createdId) redirect("/admin/users?error=db_verify_failed");

    redirect("/admin/users?ok=1");
  }

  const admin = supabaseServer();
  const { data: users } = await admin
    .from("users")
    .select("id, auth_user_id, username, full_name, email, role, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold tracking-tight">Users</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Team</div>
          </CardHeader>
          <CardContent className="grid gap-2">
            {sp.ok ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                User created.
              </div>
            ) : null}
            {sp.error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {sp.error === "invalid_fields"
                  ? "Please fill all required fields. Username must be 3–32 characters (letters/numbers/._- only). Password must be at least 8 characters."
                  : sp.error === "username_taken"
                    ? "That username is already in use."
                    : sp.error === "email_taken"
                      ? "That email is already in use."
                      : sp.error === "weak_password"
                        ? "Password is too weak. Use 8+ characters and avoid common passwords."
                        : sp.error === "auth_db_error"
                          ? "Supabase Auth database error while creating the user. This usually means your auth trigger failed—run the latest trigger SQL and try again."
                        : sp.error === "db_write_failed"
                          ? "User was created in Supabase Auth, but saving to the internal users table failed. Check your public.users schema and permissions, then try again."
                        : sp.error === "db_verify_failed"
                          ? "User creation returned success, but the row was not found in the internal users table. This usually means you’re connected to a different Supabase project than the one you’re checking in the dashboard."
                          : "Could not create user."}
              </div>
            ) : null}
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
              <table className="min-w-full text-sm">
                <thead className="bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]">
                  <tr className="text-left">
                    {["Name", "Username", "Role", "Active", "Created"].map((h) => (
                      <th key={h} className="px-3 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(users as InternalUser[] | null)?.map((u) => (
                    <tr key={u.id} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2">{u.full_name}</td>
                      <td className="px-3 py-2">{u.username}</td>
                      <td className="px-3 py-2">{u.role}</td>
                      <td className="px-3 py-2">{u.is_active ? "Yes" : "No"}</td>
                      <td className="px-3 py-2">{u.created_at.slice(0, 10)}</td>
                    </tr>
                  )) ?? null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold tracking-tight">Add user</div>
          </CardHeader>
          <CardContent>
            <form action={createUser} className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" required minLength={2} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" required minLength={3} pattern="^[a-zA-Z0-9._-]+$" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input id="email" name="email" placeholder="optional" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select id="role" name="role" defaultValue="caller">
                  <option value="admin">admin</option>
                  <option value="manager">manager</option>
                  <option value="caller">caller</option>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Temporary password</Label>
                <Input id="password" name="password" type="password" required minLength={8} />
              </div>
              <Button type="submit" className="w-full">Create user</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
