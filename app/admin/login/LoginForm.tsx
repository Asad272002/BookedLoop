"use client";

import * as React from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

export function LoginForm() {
  const [pending, setPending] = React.useState(false);

  return (
    <form
      method="post"
      action="/admin/login/action"
      className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] p-6"
      onSubmit={() => setPending(true)}
    >
      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoComplete="username" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[color-mix(in_srgb,var(--background)_60%,transparent)] border-t-[var(--background)]" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}

