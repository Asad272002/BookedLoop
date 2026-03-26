import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import Link from "next/link";
import { site } from "@/lib/site";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { supabaseServer } from "@/lib/supabase/server";
import { FadeUp, Stagger } from "@/components/AnimateIn";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  async function action(formData: FormData) {
    "use server";
    const debug = process.env.BL_DEBUG_AUTH === "1";
    const username = String(formData.get("username") || "");
    const password = String(formData.get("password") || "");
    if (!username || !password) {
      redirect("/admin/login?error=invalid");
    }

    const admin = supabaseServer();
    const { data: profile } = await admin
      .from("users")
      .select("email, role, is_active")
      .eq("username", username)
      .maybeSingle();

    if (!profile || profile.is_active === false) {
      redirect("/admin/login?error=invalid");
    }

    const jar = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return jar.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          if (debug) {
            console.log("[auth-debug] login setAll", {
              cookieNames: cookiesToSet.map((c) => c.name),
              cookieCount: cookiesToSet.length,
            });
          }
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });
    if (debug) {
      console.log("[auth-debug] login signIn result", { ok: Boolean(data.session), hasError: Boolean(error) });
    }
    if (error || !data.session) {
      redirect("/admin/login?error=invalid");
    }

    await supabase.auth.getSession();

    const role = (data.user?.app_metadata?.role as string | undefined) ?? profile.role;
    if (role === "caller") redirect("/admin/calls");
    redirect("/admin");
  }

  const sp = (await searchParams) ?? {};

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <Stagger className="grid gap-6">
        <FadeUp className="text-center">
          <div className="text-lg font-semibold tracking-tight">{site.name} Admin</div>
          <div className="mt-1 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">Sign in to access the dashboard</div>
          {sp.error === "invalid" ? (
            <div className="mt-3 text-xs text-red-500">Invalid username or password</div>
          ) : null}
        </FadeUp>
        <FadeUp>
          <form action={action} className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] p-6">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" autoComplete="username" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </FadeUp>
        <FadeUp className="text-center text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">
          Need access? <Link href="/contact" className="underline underline-offset-4">Contact BookedLoop</Link>
        </FadeUp>
      </Stagger>
    </div>
  );
}
