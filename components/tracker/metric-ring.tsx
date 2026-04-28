import { cn } from "@/lib/utils";

export function MetricRing({
  label,
  actual,
  target,
  unit,
  colorClass
}: {
  label: string;
  actual: number;
  target: number;
  unit: string;
  colorClass: string;
}) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? actual / target : 0;
  const progress = Math.min(ratio, 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-3 rounded-[1.75rem] bg-white/72 px-4 py-5 text-center shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
          <circle cx="44" cy="44" r={radius} className="fill-none stroke-[6] text-secondary" stroke="currentColor" />
          <circle
            cx="44"
            cy="44"
            r={radius}
            className={cn("fill-none stroke-[6] transition-all duration-500", colorClass)}
            stroke="currentColor"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold">{Math.round(actual)}</span>
          <span className="text-[11px] text-muted-foreground">
            / {Math.round(target)} {unit}
          </span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{Math.round(ratio * 100)}% 达成</p>
      </div>
    </div>
  );
}
