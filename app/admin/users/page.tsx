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

const updateUserSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().min(2).max(80),
  email: z.string().email(),
  role: z.enum(["admin", "manager", "caller"]),
  isActive: z.enum(["true", "false"]),
  password: z.string().optional().or(z.literal("")),
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

export default async function UsersPage() {
  const jar = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return jar.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          jar.set(name, value, {
            ...options,
            path: options?.path ?? "/",
            sameSite: options?.sameSite ?? "lax",
            secure: options?.secure ?? process.env.NODE_ENV === "production",
          });
        });
      },
    },
  });
  const role = ((await supabase.auth.getUser()).data.user?.app_metadata?.role as string | undefined) ?? "caller";
  if (role !== "admin") redirect("/admin");

  async function updateUser(formData: FormData) {
    "use server";
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
            cookiesToSet.forEach(({ name, value, options }) => {
              jar.set(name, value, {
                ...options,
                path: options?.path ?? "/",
                sameSite: options?.sameSite ?? "lax",
                secure: options?.secure ?? process.env.NODE_ENV === "production",
              });
            });
          },
        },
      });
      const sessionUser = (await supabase.auth.getUser()).data.user ?? null;
      if (!sessionUser?.id) redirect("/admin/login");
      const role = (sessionUser.app_metadata?.role as string | undefined) ?? "caller";
      if (role !== "admin") redirect("/admin/users?error=forbidden");
    }
    const parsed = updateUserSchema.safeParse({
      id: String(formData.get("id") || "").trim(),
      fullName: String(formData.get("fullName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      role: String(formData.get("role") || "").trim(),
      isActive: String(formData.get("isActive") || "").trim(),
      password: String(formData.get("password") || ""),
    });

    if (!parsed.success) redirect("/admin/users?error=invalid_fields");

    const admin = supabaseServer();
    const { id, fullName, email, role, isActive, password } = parsed.data;

    const { data: existing } = await admin
      .from("users")
      .select("id, auth_user_id, username, is_active")
      .eq("id", id)
      .maybeSingle();

    if (!existing?.id) redirect("/admin/users?error=invalid");

    const nextActive = isActive === "true";
    const { error: updateErr } = await admin
      .from("users")
      .update({
        full_name: fullName,
        email,
        role,
        is_active: nextActive,
      })
      .eq("id", id);
    if (updateErr) redirect("/admin/users?error=db_write_failed");

    if (existing.auth_user_id) {
      const { error: authErr } = await admin.auth.admin.updateUserById(existing.auth_user_id, {
        user_metadata: { username: existing.username, full_name: fullName },
        app_metadata: { role },
        ...(password ? { password } : {}),
      });
      if (authErr) redirect("/admin/users?error=auth_update_failed");
    }

    if (existing.is_active !== nextActive) {
      redirect(`/admin/users?toast=${nextActive ? "user_reactivated" : "user_deactivated"}`);
    }
    redirect("/admin/users?toast=user_updated");
  }

  async function deleteUser(formData: FormData) {
    "use server";
    let currentAuthUserId: string | null = null;
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
            cookiesToSet.forEach(({ name, value, options }) => {
              jar.set(name, value, {
                ...options,
                path: options?.path ?? "/",
                sameSite: options?.sameSite ?? "lax",
                secure: options?.secure ?? process.env.NODE_ENV === "production",
              });
            });
          },
        },
      });
      const sessionUser = (await supabase.auth.getUser()).data.user ?? null;
      if (!sessionUser?.id) redirect("/admin/login");
      const role = (sessionUser.app_metadata?.role as string | undefined) ?? "caller";
      if (role !== "admin") redirect("/admin/users?error=forbidden");
      currentAuthUserId = sessionUser.id;
    }
    const id = String(formData.get("id") || "").trim();
    if (!id) redirect("/admin/users?error=invalid");

    const admin = supabaseServer();
    const { data: existing, error: getErr } = await admin
      .from("users")
      .select("id, auth_user_id, username, full_name, email, role, is_active")
      .eq("id", id)
      .maybeSingle();

    if (getErr || !existing?.id) redirect("/admin/users?error=invalid");

    if (existing.auth_user_id && existing.auth_user_id === currentAuthUserId) {
      redirect("/admin/users?error=cannot_delete_self");
    }

    const { error: deleteErr } = await admin.from("users").delete().eq("id", id);
    if (deleteErr) {
      const msg = deleteErr.message.toLowerCase();
      if (msg.includes("foreign key")) redirect("/admin/users?error=user_in_use");
      redirect("/admin/users?error=db_write_failed");
    }

    if (existing.auth_user_id) {
      const { error: authDeleteErr } = await admin.auth.admin.deleteUser(existing.auth_user_id);
      if (authDeleteErr) {
        await admin.from("users").insert({
          id: existing.id,
          auth_user_id: existing.auth_user_id,
          username: existing.username,
          full_name: existing.full_name,
          email: existing.email,
          role: existing.role,
          is_active: existing.is_active,
        });
        redirect("/admin/users?error=auth_delete_failed");
      }
    }

    redirect("/admin/users?toast=user_deleted");
  }

  async function createUser(formData: FormData) {
    "use server";
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
            cookiesToSet.forEach(({ name, value, options }) => {
              jar.set(name, value, {
                ...options,
                path: options?.path ?? "/",
                sameSite: options?.sameSite ?? "lax",
                secure: options?.secure ?? process.env.NODE_ENV === "production",
              });
            });
          },
        },
      });
      const sessionUser = (await supabase.auth.getUser()).data.user ?? null;
      if (!sessionUser?.id) redirect("/admin/login");
      const role = (sessionUser.app_metadata?.role as string | undefined) ?? "caller";
      if (role !== "admin") redirect("/admin/users?error=forbidden");
    }
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
          redirect("/admin/users?toast=user_created");
        }

        const { data: updated, error: updateErr } = await admin
          .from("users")
          .update(fullRow)
          .eq("username", username)
          .select("id")
          .maybeSingle();

        if (!updateErr && updated?.id) {
          redirect("/admin/users?toast=user_created");
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

    redirect("/admin/users?toast=user_created");
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
            <div className="overflow-x-auto overflow-y-visible rounded-2xl border border-[var(--border)]">
              <table className="min-w-full text-sm">
                <thead className="bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]">
                  <tr className="text-left">
                    {["Name", "Username", "Role", "Access", "Created", ""].map((h) => (
                      <th key={h} className="px-3 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(users as InternalUser[] | null)?.map((u) => (
                    <tr key={u.id} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2">{u.full_name ?? u.username ?? "—"}</td>
                      <td className="px-3 py-2">{u.username ?? "—"}</td>
                      <td className="px-3 py-2">{u.role ?? "caller"}</td>
                      <td className="px-3 py-2">{u.is_active ? "Enabled" : "Disabled"}</td>
                      <td className="px-3 py-2">{(u.created_at ?? "").slice(0, 10) || "—"}</td>
                      <td className="px-3 py-2 text-right align-top">
                        <details className="inline-block w-full text-left">
                          <summary className="cursor-pointer rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-1.5 text-sm hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]">
                            Manage
                          </summary>
                          <div className="mt-2 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_94%,transparent)] p-3">
                            <form action={updateUser} className="grid gap-2">
                              <input type="hidden" name="id" value={u.id} />
                              <div className="grid gap-1">
                                <Label htmlFor={`fullName-${u.id}`}>Full name</Label>
                                <Input id={`fullName-${u.id}`} name="fullName" defaultValue={u.full_name ?? ""} required />
                              </div>
                              <div className="grid gap-1">
                                <Label htmlFor={`email-${u.id}`}>Email</Label>
                                <Input id={`email-${u.id}`} name="email" type="email" defaultValue={u.email ?? ""} required />
                              </div>
                              <div className="grid gap-1 sm:grid-cols-2">
                                <div className="grid gap-1">
                                  <Label htmlFor={`role-${u.id}`}>Role</Label>
                                  <Select id={`role-${u.id}`} name="role" defaultValue={u.role ?? "caller"}>
                                    <option value="admin">admin</option>
                                    <option value="manager">manager</option>
                                    <option value="caller">caller</option>
                                  </Select>
                                </div>
                                <div className="grid gap-1">
                                  <Label htmlFor={`isActive-${u.id}`}>Access</Label>
                                  <Select id={`isActive-${u.id}`} name="isActive" defaultValue={u.is_active ? "true" : "false"}>
                                    <option value="true">enabled</option>
                                    <option value="false">disabled</option>
                                  </Select>
                                </div>
                              </div>
                              <div className="grid gap-1">
                                <Label htmlFor={`password-${u.id}`}>Reset password (optional)</Label>
                                <Input id={`password-${u.id}`} name="password" type="password" minLength={8} placeholder="New password" />
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <Button type="submit" variant="secondary" size="sm">
                                  Save
                                </Button>
                              </div>
                            </form>
                            <details className="mt-2 rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_85%,transparent)] px-3 py-2">
                              <summary className="cursor-pointer text-sm font-medium text-red-600">Delete permanently</summary>
                              <div className="mt-2 grid gap-2">
                                <div className="text-xs text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                                  This removes the user record. If the user has linked activity, deletion will fail—use Deactivate instead.
                                </div>
                                <form action={deleteUser}>
                                  <input type="hidden" name="id" value={u.id} />
                                  <Button
                                    type="submit"
                                    size="sm"
                                    className="w-full bg-red-600 text-white hover:bg-red-700"
                                  >
                                    Confirm delete
                                  </Button>
                                </form>
                              </div>
                            </details>
                          </div>
                        </details>
                      </td>
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
