"use client";

import { useEffect, useState } from "react";
import { GripVertical, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/tracker/section-title";
import { UnitInput } from "@/components/ui/unit-input";
import { type WeeklyPlanDay } from "@/lib/calculator";
import { DayType, type DayType as DayTypeType } from "@/lib/domain";
import { getWeekDateKeys, MONDAY_FIRST_WEEK_LABELS } from "@/lib/format";
import { dayTypeMeta } from "@/lib/ui-config";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { useTrackerStore } from "@/store/tracker-store";

const dayTypeOptions = [DayType.HIGH_CARB, DayType.MEDIUM_CARB, DayType.LOW_CARB, DayType.REST] as const;

function TargetEditor({
  day,
  onChange
}: {
  day: WeeklyPlanDay;
  onChange: (field: "targetCalories" | "targetProteinG" | "targetFatG" | "targetCarbsG", value: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <UnitInput
        label="热量"
        unit="kcal"
        type="number"
        inputMode="numeric"
        min={0}
        value={Math.round(day.targetCalories)}
        onChange={(event) => onChange("targetCalories", Number(event.target.value) || 0)}
        className="h-10 rounded-xl"
      />
      <UnitInput
        label="蛋白"
        unit="g"
        type="number"
        inputMode="decimal"
        min={0}
        step="1"
        value={Math.round(day.targetProteinG)}
        onChange={(event) => onChange("targetProteinG", Number(event.target.value) || 0)}
        className="h-10 rounded-xl"
      />
      <UnitInput
        label="脂肪"
        unit="g"
        type="number"
        inputMode="decimal"
        min={0}
        step="1"
        value={Math.round(day.targetFatG)}
        onChange={(event) => onChange("targetFatG", Number(event.target.value) || 0)}
        className="h-10 rounded-xl"
      />
      <UnitInput
        label="碳水"
        unit="g"
        type="number"
        inputMode="decimal"
        min={0}
        step="1"
        value={Math.round(day.targetCarbsG)}
        onChange={(event) => onChange("targetCarbsG", Number(event.target.value) || 0)}
        className="h-10 rounded-xl"
      />
    </div>
  );
}

export function PlanScreen() {
  const { toast } = useToast();
  const weeklyPlan = useTrackerStore((state) => state.weeklyPlan);
  const selectedDate = useTrackerStore((state) => state.selectedDate);
  const swapPlanDays = useTrackerStore((state) => state.swapPlanDays);
  const setPlanDayType = useTrackerStore((state) => state.setPlanDayType);
  const updatePlanDayTarget = useTrackerStore((state) => state.updatePlanDayTarget);
  const regeneratePlan = useTrackerStore((state) => state.regeneratePlan);
  const authUser = useAuthStore((state) => state.user);
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!dirty || !isAuthConfigured || !authUser) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setSyncing(true);
        const weekDates = getWeekDateKeys(selectedDate);
        const response = await fetch("/api/daily-plans", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            plans: weeklyPlan.days.map((day, index) => ({
              date: new Date(`${weekDates[index]}T12:00:00.000Z`).toISOString(),
              day_type: day.dayType,
              target_calories: day.targetCalories,
              target_protein_g: day.targetProteinG,
              target_fat_g: day.targetFatG,
              target_carbs_g: day.targetCarbsG,
              actual_calories: 0,
              actual_protein_g: 0,
              actual_fat_g: 0,
              actual_carbs_g: 0
            }))
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "同步计划失败");
        }

        toast({
          title: "计划已同步",
          description: "当前周计划已经保存到账号。",
          variant: "success"
        });
        setDirty(false);
      } catch (error) {
        toast({
          title: "同步失败",
          description: error instanceof Error ? error.message : "请稍后再试。",
          variant: "error"
        });
      } finally {
        setSyncing(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [authUser, dirty, isAuthConfigured, selectedDate, toast, weeklyPlan.days]);

  function handleDrop(targetIndex: number) {
    if (draggingIndex === null || draggingIndex === targetIndex) {
      setDraggingIndex(null);
      return;
    }

    swapPlanDays(draggingIndex, targetIndex);
    setDraggingIndex(null);
    setDirty(true);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 safe-px pb-28 pt-6">
      <section className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">每周计划</p>
          <h1 className="text-3xl font-semibold tracking-tight">碳循环安排</h1>
          <p className="text-sm text-muted-foreground">拖动卡片可以互换日期，也可以手动微调每日目标。</p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => setEditMode((current) => !current)}>
          {editMode ? "完成编辑" : "手动编辑"}
        </Button>
      </section>

      <section className="rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
        <SectionTitle
          eyebrow="WEEKLY TARGET"
          title={`本周预计 ${Math.round(weeklyPlan.weeklyTargetCalories)} kcal`}
          action={
            <Button
              className="rounded-full"
              onClick={() => {
                regeneratePlan();
                setDirty(true);
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {syncing ? "同步中…" : "重新生成计划"}
            </Button>
          }
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        {weeklyPlan.days.map((day, index) => (
          <article
            key={day.dayIndex}
            draggable
            onDragStart={() => setDraggingIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(index)}
            className={cn(
              "rounded-[1.8rem] p-4 shadow-sm ring-1 transition-all",
              dayTypeMeta[day.dayType].softClass,
              draggingIndex === index ? "scale-[0.98] opacity-60" : "opacity-100"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium opacity-80">{MONDAY_FIRST_WEEK_LABELS[index]}</p>
                <h2 className="mt-1 text-xl font-semibold">{dayTypeMeta[day.dayType].label}</h2>
              </div>
              <GripVertical className="h-5 w-5 opacity-60" />
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-white/55 px-3 py-2 dark:bg-black/10">
                <span>热量</span>
                <span className="font-semibold">{Math.round(day.targetCalories)} kcal</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/55 px-3 py-2 dark:bg-black/10">
                <span>蛋白</span>
                <span className="font-semibold">{Math.round(day.targetProteinG)}g</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/55 px-3 py-2 dark:bg-black/10">
                <span>脂肪</span>
                <span className="font-semibold">{Math.round(day.targetFatG)}g</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/55 px-3 py-2 dark:bg-black/10">
                <span>碳水</span>
                <span className="font-semibold">{Math.round(day.targetCarbsG)}g</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {dayTypeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setPlanDayType(day.dayIndex, option as DayTypeType);
                    setDirty(true);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold",
                    day.dayType === option ? "bg-foreground text-background" : "bg-white/60 text-foreground dark:bg-black/10"
                  )}
                >
                  {dayTypeMeta[option].shortLabel}
                </button>
              ))}
            </div>

            {editMode ? (
              <div className="mt-4">
                <TargetEditor
                  day={day}
                  onChange={(field, value) => {
                    updatePlanDayTarget(day.dayIndex, field, value);
                    setDirty(true);
                  }}
                />
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
