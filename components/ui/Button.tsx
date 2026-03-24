import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--foreground)] text-[var(--background)] hover:bg-[color-mix(in_srgb,var(--foreground)_92%,transparent)]",
  secondary:
    "border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_85%,transparent)] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--card)_70%,transparent)]",
  ghost:
    "text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

export function Button(
  props: CommonProps &
    (
      | ({ href: string } & Omit<React.ComponentProps<typeof Link>, "href">)
      | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
    )
) {
  const { variant = "primary", size = "md", className, children, ...rest } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in rest && typeof rest.href === "string") {
    const { href, ...linkProps } = rest;
    const isExternal =
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:");

    if (isExternal) {
      const anchorProps = {
        ...(linkProps as unknown as Record<string, unknown>),
      };
      delete anchorProps.prefetch;
      delete anchorProps.replace;
      delete anchorProps.scroll;
      delete anchorProps.shallow;
      delete anchorProps.locale;

      return (
        <a
          href={href}
          className={classes}
          target={(anchorProps.target as string | undefined) ?? "_blank"}
          rel={(anchorProps.rel as string | undefined) ?? "noreferrer"}
          {...(anchorProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
