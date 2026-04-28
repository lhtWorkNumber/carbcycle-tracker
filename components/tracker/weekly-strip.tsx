import { type WeeklyPlan } from "@/lib/calculator";
import { SHORT_WEEK_LABELS } from "@/lib/format";
import { dayTypeMeta } from "@/lib/ui-config";
import { cn } from "@/lib/utils";

export function WeeklyStrip({
  weeklyPlan,
  activeIndex
}: {
  weeklyPlan: WeeklyPlan;
  activeIndex: number;
}) {
  return (
    <div className="grid grid-cols-7 gap-2 rounded-[1.75rem] bg-white/72 p-3 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
      {weeklyPlan.days.map((day) => (
        <div
          key={day.dayIndex}
          className={cn(
            "flex flex-col items-center gap-2 rounded-2xl px-2 py-3",
            day.dayIndex === activeIndex ? "bg-secondary" : "bg-transparent"
          )}
        >
          <span className="text-[11px] font-medium text-muted-foreground">{SHORT_WEEK_LABELS[day.dayIndex]}</span>
          <span className={cn("h-2.5 w-2.5 rounded-full", dayTypeMeta[day.dayType].dotClass)} />
          <span className="text-[11px] font-semibold">{dayTypeMeta[day.dayType].shortLabel}</span>
        </div>
      ))}
    </div>
  );
}
