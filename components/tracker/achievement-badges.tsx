import { Award, Flame, Scale } from "lucide-react";

import { type Achievement } from "@/lib/domain";
import { cn } from "@/lib/utils";

const iconMap = {
  "streak-7": Flame,
  "record-30": Award,
  "weight-loss-5": Scale
} as const;

export function AchievementBadges({ achievements }: { achievements: Achievement[] }) {
  return (
    <section className="space-y-3 rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
      <h2 className="text-lg font-semibold">打卡成就</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {achievements.map((achievement) => {
          const Icon = iconMap[achievement.id as keyof typeof iconMap] ?? Award;

          return (
            <div
              key={achievement.id}
              className={cn(
                "rounded-[1.4rem] px-4 py-4 ring-1",
                achievement.unlocked
                  ? "bg-primary text-primary-foreground ring-primary/30"
                  : "bg-secondary text-secondary-foreground ring-border"
              )}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5" />
                <span className="text-xs font-semibold">{Math.round(achievement.progress)}%</span>
              </div>
              <p className="mt-4 font-semibold">{achievement.title}</p>
              <p className="mt-1 text-xs opacity-80">{achievement.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
