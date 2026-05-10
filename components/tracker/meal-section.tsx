import Link from "next/link";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";

import { type LoggedMeal, type MealType } from "@/lib/domain";
import { mealTypeLabels } from "@/lib/ui-config";
import { Button } from "@/components/ui/button";

export function MealSection({
  mealType,
  meals,
  deletingMealId,
  onDeleteMeal
}: {
  mealType: MealType;
  meals: LoggedMeal[];
  deletingMealId?: string | null;
  onDeleteMeal?: (mealId: string) => void;
}) {
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

  return (
    <section className="space-y-3 rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">{mealTypeLabels[mealType]}</h3>
          <p className="text-xs text-muted-foreground">{Math.round(totalCalories)} kcal</p>
        </div>
        <Link
          href={`/add-food?meal=${mealType.toLowerCase()}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          aria-label={`添加${mealTypeLabels[mealType]}`}
        >
          <Plus className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-2">
        {meals.length > 0 ? (
          meals.map((meal) => (
            <div
              key={meal.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-background/70 px-3 py-3 dark:bg-background/40"
            >
              <div className="min-w-0">
                <p className="truncate font-medium" title={meal.nameZh}>
                  {meal.nameZh}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {meal.quantityGrams}g · 蛋白 {Math.round(meal.protein)}g · 碳水 {Math.round(meal.carbs)}g
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                <p className="whitespace-nowrap text-right text-sm font-semibold">{Math.round(meal.calories)} kcal</p>
                {onDeleteMeal ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteMeal(meal.id)}
                    disabled={deletingMealId === meal.id}
                    aria-label={`删除${meal.nameZh}`}
                  >
                    {deletingMealId === meal.id ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            还没有记录，点击右上角添加
          </div>
        )}
      </div>
    </section>
  );
}
