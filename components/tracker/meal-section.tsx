import Link from "next/link";
import { Plus } from "lucide-react";

import { type LoggedMeal, type MealType } from "@/lib/domain";
import { mealTypeLabels } from "@/lib/ui-config";

export function MealSection({
  mealType,
  meals
}: {
  mealType: MealType;
  meals: LoggedMeal[];
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
              className="flex items-center justify-between rounded-2xl bg-background/70 px-3 py-3 dark:bg-background/40"
            >
              <div>
                <p className="font-medium">{meal.nameZh}</p>
                <p className="text-xs text-muted-foreground">
                  {meal.quantityGrams}g · 蛋白 {Math.round(meal.protein)}g · 碳水 {Math.round(meal.carbs)}g
                </p>
              </div>
              <p className="text-sm font-semibold">{Math.round(meal.calories)} kcal</p>
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
