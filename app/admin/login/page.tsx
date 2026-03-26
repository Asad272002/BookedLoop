import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import Link from "next/link";
import { site } from "@/lib/site";
import { FadeUp, Stagger } from "@/components/AnimateIn";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
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
          <form method="post" action="/admin/login/action" className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] p-6">
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
