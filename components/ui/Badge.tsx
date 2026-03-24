import * as React from "react";

import { cn } from "@/lib/cn";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_75%,transparent)] px-3 py-1 text-xs font-medium text-[color-mix(in_srgb,var(--foreground)_86%,transparent)]",
        className
      )}
      {...props}
    />
  );
}
