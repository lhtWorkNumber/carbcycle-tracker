"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { UnitInput } from "@/components/ui/unit-input";
import { quickExercises } from "@/lib/demo-data";
import { ExerciseType, type ExerciseType as ExerciseTypeType } from "@/lib/domain";
import { exerciseTypeLabels } from "@/lib/ui-config";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { useTrackerStore } from "@/store/tracker-store";

const exerciseTypes = [ExerciseType.STRENGTH, ExerciseType.CARDIO, ExerciseType.HIIT, ExerciseType.FLEXIBILITY] as const;

export function ExerciseScreen() {
  const { toast } = useToast();
  const selectedDate = useTrackerStore((state) => state.selectedDate);
  const exercises = useTrackerStore((state) => state.exercises);
  const addExercise = useTrackerStore((state) => state.addExercise);
  const insertExerciseFromServer = useTrackerStore((state) => state.insertExerciseFromServer);
  const authUser = useAuthStore((state) => state.user);
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const todayExercises = exercises.filter((exercise) => exercise.date === selectedDate);
  const [exerciseName, setExerciseName] = useState("深蹲");
  const [duration, setDuration] = useState("45");
  const [calories, setCalories] = useState("320");
  const [exerciseType, setExerciseType] = useState<ExerciseTypeType>(ExerciseType.STRENGTH);
  const [submitting, setSubmitting] = useState(false);

  async function addCurrentExercise() {
    setSubmitting(true);

    try {
      if (isAuthConfigured && authUser) {
        const response = await fetch("/api/exercise-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            date: new Date(`${selectedDate}T12:00:00.000Z`).toISOString(),
            exercise_name: exerciseName,
            duration_minutes: Number(duration),
            calories_burned: Number(calories),
            exercise_type: exerciseType
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "保存运动记录失败");
        }

        const exercise = await response.json();
        insertExerciseFromServer(exercise);
      } else {
        addExercise({
          exerciseName,
          durationMinutes: Number(duration),
          caloriesBurned: Number(calories),
          exerciseType
        });
      }

      toast({
        title: "运动记录已保存",
        description: `${exerciseName} 已加入今日训练。`,
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后再试。",
        variant: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 safe-px pb-28 pt-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">运动记录</p>
        <h1 className="text-3xl font-semibold tracking-tight">今天练了什么</h1>
      </section>

      <section className="space-y-3 rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
        <h2 className="text-lg font-semibold">快速添加</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {quickExercises.map((exercise) => (
            <button
              key={exercise.name}
              type="button"
              onClick={() => {
                setExerciseName(exercise.name);
                setDuration(String(exercise.durationMinutes));
                setCalories(String(exercise.caloriesBurned));
                setExerciseType(exercise.exerciseType);
              }}
              className="rounded-[1.5rem] bg-secondary px-4 py-4 text-left transition-colors hover:bg-secondary/80"
            >
              <p className="font-semibold">{exercise.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {exercise.durationMinutes} 分钟 · {exercise.caloriesBurned} kcal
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
        <div className="grid gap-3 sm:grid-cols-2">
          <UnitInput label="运动名称" value={exerciseName} onChange={(event) => setExerciseName(event.target.value)} placeholder="例如 深蹲" />
          <UnitInput label="训练时长" unit="分钟" value={duration} onChange={(event) => setDuration(event.target.value)} type="number" inputMode="numeric" min={1} className="pr-14" />
          <UnitInput label="预计消耗" unit="kcal" value={calories} onChange={(event) => setCalories(event.target.value)} type="number" inputMode="numeric" min={0} />
          <div className="flex flex-wrap gap-2 rounded-[1.3rem] bg-secondary p-2">
            {exerciseTypes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setExerciseType(item)}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-semibold",
                  exerciseType === item ? "bg-background shadow-sm" : "text-muted-foreground"
                )}
              >
                {exerciseTypeLabels[item]}
              </button>
            ))}
          </div>
        </div>
        <Button className="mt-4 h-12 w-full rounded-[1.3rem]" onClick={() => void addCurrentExercise()} disabled={submitting}>
          {submitting ? "保存中…" : "保存运动记录"}
        </Button>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[1.6rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
          <p className="text-sm text-muted-foreground">今日总时长</p>
          <p className="mt-2 text-3xl font-semibold">
            {todayExercises.reduce((sum, item) => sum + item.durationMinutes, 0)} 分钟
          </p>
        </div>
        <div className="rounded-[1.6rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
          <p className="text-sm text-muted-foreground">预计消耗</p>
          <p className="mt-2 text-3xl font-semibold">
            {todayExercises.reduce((sum, item) => sum + item.caloriesBurned, 0)} kcal
          </p>
        </div>
        <div className="rounded-[1.6rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
          <p className="text-sm text-muted-foreground">训练条目</p>
          <p className="mt-2 text-3xl font-semibold">{todayExercises.length} 个</p>
        </div>
      </section>

      <section className="space-y-3">
        {todayExercises.map((exercise) => (
          <div key={exercise.id} className="rounded-[1.6rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{exercise.exerciseName}</p>
                <p className="text-sm text-muted-foreground">
                  {exerciseTypeLabels[exercise.exerciseType]} · {exercise.durationMinutes} 分钟
                </p>
              </div>
              <p className="text-lg font-semibold">{exercise.caloriesBurned} kcal</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
