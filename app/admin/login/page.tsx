import Link from "next/link";
import { site } from "@/lib/site";
import { FadeUp, Stagger } from "@/components/AnimateIn";
import { LoginForm } from "@/app/admin/login/LoginForm";

export default async function AdminLoginPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <Stagger className="grid gap-6">
        <FadeUp className="text-center">
          <div className="text-lg font-semibold tracking-tight">{site.name} Admin</div>
          <div className="mt-1 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">Sign in to access the dashboard</div>
        </FadeUp>
        <FadeUp>
          <LoginForm />
        </FadeUp>
        <FadeUp className="text-center text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">
          Need access? <Link href="/contact" className="underline underline-offset-4">Contact BookedLoop</Link>
        </FadeUp>
      </Stagger>
    </div>
  );
}
