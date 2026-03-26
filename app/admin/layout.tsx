import Link from "next/link";

import { cn } from "@/lib/cn";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { FadeUp } from "@/components/AnimateIn";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import type { Role } from "@/lib/auth/roles";

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
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = ((user?.app_metadata?.role as Role | undefined) ?? "caller") as Role;

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
          { href: "/admin/settings", label: "Settings" },
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
            <Link
              href="/admin/logout"
              className="mt-2 rounded-md px-3 py-2 text-[color-mix(in_srgb,var(--foreground)_78%,transparent)] hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-[var(--foreground)]"
            >
              Logout
            </Link>
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
            </div>
          </header>
          <FadeUp className="p-4">{children}</FadeUp>
        </main>
      </div>
    </div>
  );
}
