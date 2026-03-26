import { cn } from "@/lib/cn";

const colors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  assigned: "bg-indigo-100 text-indigo-700",
  contacted: "bg-teal-100 text-teal-700",
  follow_up: "bg-yellow-100 text-yellow-800",
  interested: "bg-emerald-100 text-emerald-700",
  audit_booked: "bg-cyan-100 text-cyan-700",
  proposal_sent: "bg-purple-100 text-purple-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
  dnc: "bg-zinc-100 text-zinc-700",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";
  const color = colors[status] ?? "bg-zinc-100 text-zinc-700";
  const label = status.replace(/_/g, " ");
  return <span className={cn(base, color, className)}>{label}</span>;
}
