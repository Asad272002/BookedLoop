import Link from "next/link";

import { cn } from "@/lib/cn";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { FadeUp } from "@/components/AnimateIn";
import { AdminFlashToasts } from "@/app/admin/AdminFlashToasts";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import type { Role } from "@/lib/auth/roles";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className="text-lg font-semibold tracking-tight">Admin is not configured</div>
          <div className="mt-2 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
            Missing Supabase environment variables in production.
          </div>
        </div>
      </div>
    );
  }
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
  const isProd = process.env.NODE_ENV === "production";
  const sessionUser = isProd
    ? (await supabase.auth.getSession()).data.session?.user ?? null
    : (await supabase.auth.getUser()).data.user ?? null;
  const role = ((sessionUser?.app_metadata?.role as Role | undefined) ?? "caller") as Role;

  const me =
    sessionUser?.id
      ? await supabaseServer()
          .from("users")
          .select("full_name, username, role")
          .eq("auth_user_id", sessionUser.id)
          .maybeSingle()
      : null;
  const displayName = me?.data?.full_name ?? me?.data?.username ?? sessionUser?.email ?? "Unknown";
  const displayRole = (me?.data?.role as string | null) ?? role;
  const initials = String(displayName)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const nav =
    role === "admin"
      ? [
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/leads", label: "Leads" },
          { href: "/admin/calls", label: "Calls" },
          { href: "/admin/audits", label: "Audits" },
          { href: "/admin/proposals", label: "Proposals" },
          { href: "/admin/invoices", label: "Invoices" },
          { href: "/admin/users", label: "Users" },
        ]
      : role === "manager"
        ? [
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/leads", label: "Leads" },
            { href: "/admin/calls", label: "Calls" },
            { href: "/admin/audits", label: "Audits" },
            { href: "/admin/proposals", label: "Proposals" },
            { href: "/admin/invoices", label: "Invoices" },
          ]
        : [
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/calls", label: "Calls" },
            { href: "/admin/leads", label: "Leads" },
          ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <AdminFlashToasts />
      <div className="flex">
        <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)]">
          <div className="flex items-center gap-2 px-4 py-4">
            <div className="text-sm font-semibold tracking-tight">{site.name}</div>
          </div>
          <nav className="grid gap-1 p-2 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-[color-mix(in_srgb,var(--foreground)_78%,transparent)] hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-[var(--foreground)]"
                )}
              >
                {item.label}
              </Link>
            ))}
            <form method="post" action="/admin/logout" className="mt-2">
              <button
                type="submit"
                className="w-full rounded-md px-3 py-2 text-left text-[color-mix(in_srgb,var(--foreground)_78%,transparent)] hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-[var(--foreground)]"
              >
                Logout
              </button>
            </form>
          </nav>
        </aside>
        <main className="flex-1">
          <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="text-sm font-semibold">Internal Dashboard</div>
            <div className="flex items-center gap-2">
              {role !== "caller" ? (
                <Button href="/admin/leads/new" variant="secondary" size="sm">
                  Add Lead
                </Button>
              ) : null}
              <div className="ml-2 flex items-center gap-3 rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-1.5">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)] text-xs font-semibold">
                  {initials || "U"}
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-medium">{displayName}</div>
                  <div className="text-xs text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">{displayRole}</div>
                </div>
              </div>
            </div>
          </header>
          <FadeUp className="p-4">{children}</FadeUp>
        </main>
      </div>
    </div>
  );
}
