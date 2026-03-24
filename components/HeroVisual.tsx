import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { BoltIcon, CalendarIcon, StarIcon } from "@/components/icons";

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="pointer-events-none absolute -inset-10 rounded-[32px] bg-[radial-gradient(closest-side,rgba(45,107,255,0.35),transparent)] blur-2xl" />
      <div className="pointer-events-none absolute -inset-10 rounded-[32px] bg-[radial-gradient(closest-side,rgba(46,233,166,0.20),transparent)] blur-3xl" />

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-2)_18%,transparent),transparent_50%,color-mix(in_srgb,var(--accent)_16%,transparent))]" />
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-semibold tracking-tight">
                Booking Dashboard
              </div>
              <div className="text-xs text-[color-mix(in_srgb,var(--foreground)_58%,transparent)]">
                Example workflow preview
              </div>
            </div>
            <Badge className="border-[color-mix(in_srgb,var(--accent-2)_38%,transparent)] bg-[color-mix(in_srgb,var(--accent-2)_14%,transparent)] text-[color-mix(in_srgb,var(--foreground)_86%,transparent)]">
              Live-ready
            </Badge>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_70%,transparent)] p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CalendarIcon className="size-5 text-[var(--accent-2)]" />
                Bookings
              </div>
              <div className="mt-3 flex items-end gap-2">
                <div className="text-3xl font-semibold tracking-tight">24</div>
                <div className="pb-1 text-xs text-[color-mix(in_srgb,var(--foreground)_58%,transparent)]">
                  this week
                </div>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]">
                <div className="h-full w-[68%] rounded-full bg-[linear-gradient(90deg,var(--accent-2),var(--accent))]" />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_70%,transparent)] p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <StarIcon className="size-5 text-[var(--accent)]" />
                Reviews
              </div>
              <div className="mt-3 flex items-end gap-2">
                <div className="text-3xl font-semibold tracking-tight">4.8</div>
                <div className="pb-1 text-xs text-[color-mix(in_srgb,var(--foreground)_58%,transparent)]">
                  avg rating
                </div>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-2 rounded-full bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]"
                  >
                    <div
                      className="h-2 rounded-full bg-[color-mix(in_srgb,var(--accent)_78%,transparent)]"
                      style={{ width: `${[90, 92, 84, 70, 55][i]}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_70%,transparent)] p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BoltIcon className="size-5 text-[color-mix(in_srgb,var(--accent-2)_85%,var(--accent)_15%)]" />
              Follow-up Loop
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                { k: "New Lead", v: "Auto reply + tag" },
                { k: "Reminder", v: "24h follow-up" },
                { k: "Booked", v: "Confirm + review ask" },
              ].map((item) => (
                <div
                  key={item.k}
                  className="rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_35%,transparent)] px-3 py-2"
                >
                  <div className="text-xs font-medium">{item.k}</div>
                  <div className="text-[11px] leading-5 text-[color-mix(in_srgb,var(--foreground)_58%,transparent)]">
                    {item.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--accent)_35%,transparent),transparent)] blur-2xl" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--accent-2)_35%,transparent),transparent)] blur-2xl" />
    </div>
  );
}
