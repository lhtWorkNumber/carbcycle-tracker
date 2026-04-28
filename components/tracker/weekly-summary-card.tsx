import { TrendingDown, TrendingUp } from "lucide-react";

import { type WeeklySummaryReport } from "@/lib/domain";

export function WeeklySummaryCard({
  report
}: {
  report: WeeklySummaryReport | undefined;
}) {
  if (!report) {
    return (
      <section className="rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
        <h2 className="text-lg font-semibold">本周周报</h2>
        <p className="mt-3 text-sm text-muted-foreground">周报会在每周结束后自动生成。</p>
      </section>
    );
  }

  const weightImproved = report.weightChange <= 0;

  return (
    <section className="space-y-4 rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">本周周报</p>
          <h2 className="mt-1 text-lg font-semibold">{report.weekLabel}</h2>
        </div>
        {weightImproved ? <TrendingDown className="h-5 w-5 text-primary" /> : <TrendingUp className="h-5 w-5 text-amber-500" />}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-secondary p-3">
          <p className="text-xs text-muted-foreground">执行率</p>
          <p className="mt-1 font-semibold">{Math.round(report.adherenceRate)}%</p>
        </div>
        <div className="rounded-2xl bg-secondary p-3">
          <p className="text-xs text-muted-foreground">体重变化</p>
          <p className="mt-1 font-semibold">{report.weightChange} kg</p>
        </div>
        <div className="rounded-2xl bg-secondary p-3">
          <p className="text-xs text-muted-foreground">平均蛋白</p>
          <p className="mt-1 font-semibold">{Math.round(report.proteinAverage)}g</p>
        </div>
        <div className="rounded-2xl bg-secondary p-3">
          <p className="text-xs text-muted-foreground">平均碳水</p>
          <p className="mt-1 font-semibold">{Math.round(report.carbsAverage)}g</p>
        </div>
      </div>
      {report.lastWeekComparison ? (
        <p className="text-sm text-muted-foreground">
          较上周执行率 {report.lastWeekComparison.adherenceRateDelta > 0 ? "+" : ""}
          {report.lastWeekComparison.adherenceRateDelta}% ，平均热量 {report.lastWeekComparison.caloriesDelta > 0 ? "+" : ""}
          {Math.round(report.lastWeekComparison.caloriesDelta)} kcal。
        </p>
      ) : null}
      <div className="rounded-[1.4rem] bg-primary/10 px-4 py-4 text-sm text-primary">{report.motivationalMessage}</div>
    </section>
  );
}
