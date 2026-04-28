import { type DayType } from "@/lib/domain";
import { dayTypeMeta } from "@/lib/ui-config";

export function DayTypeBadge({ dayType }: { dayType: DayType }) {
  const meta = dayTypeMeta[dayType];

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}>{meta.shortLabel}</span>;
}
