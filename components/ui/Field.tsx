import * as React from "react";

import { cn } from "@/lib/cn";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-sm font-medium text-[color-mix(in_srgb,var(--foreground)_86%,transparent)]",
        className
      )}
      {...props}
    />
  );
}

const fieldBase =
  "w-full rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_82%,transparent)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-28", className)} {...props} />;
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, className)} {...props} />;
}

export function FieldHint({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-xs leading-5 text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]",
        className
      )}
      {...props}
    />
  );
}

export function FieldError({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs leading-5 text-red-400", className)} {...props} />
  );
}
