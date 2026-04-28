import type { LucideIcon } from "lucide-react";

export function QuickStatCard({
  icon: Icon,
  label,
  value,
  description
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-950 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
