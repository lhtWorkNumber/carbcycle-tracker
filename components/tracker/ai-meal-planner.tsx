"use client";

import { useMemo, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";

import { generateAiMealPlan } from "@/lib/calculator";
import { FoodCategory, MealType, type FoodItemSummary, type RemainingMacros } from "@/lib/domain";
import { mealTypeLabels } from "@/lib/ui-config";
import { useToast } from "@/hooks/use-toast";
import { useTrackerStore } from "@/store/tracker-store";

export function AiMealPlanner({
  remainingMacros
}: {
  remainingMacros: RemainingMacros;
}) {
  const selectedDate = useTrackerStore((state) => state.selectedDate);
  const meals = useTrackerStore((state) => state.meals);
  const addMeals = useTrackerStore((state) => state.addMeals);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<ReturnType<typeof generateAiMealPlan>>([]);

  const remainingMealTypes = useMemo(() => {
    const loggedTypes = new Set(meals.filter((meal) => meal.date === selectedDate).map((meal) => meal.mealType));
    return [MealType.LUNCH, MealType.DINNER, MealType.SNACK].filter((mealType) => !loggedTypes.has(mealType));
  }, [meals, selectedDate]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/food-items");

      if (!response.ok) {
        throw new Error("食物库加载失败");
      }

      const result = await response.json();
      const foods: FoodItemSummary[] = result.map((food: any) => ({
        id: food.id,
        name: food.name,
        nameZh: food.name_zh,
        category: food.category as FoodCategory,
        caloriesPer100g: food.calories_per_100g,
        proteinPer100g: food.protein_per_100g,
        fatPer100g: food.fat_per_100g,
        carbsPer100g: food.carbs_per_100g,
        fiberPer100g: food.fiber_per_100g,
        giIndex: food.gi_index,
        imageUrl: food.image_url,
        isCustom: food.is_custom
      }));

      setPlans(generateAiMealPlan(remainingMacros, foods, remainingMealTypes));
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  function applyPlan() {
    addMeals(
      plans.flatMap((plan) =>
        plan.foods
          .filter((item) => item.foodItemId !== undefined)
          .map((item) => ({
            foodItemId: item.foodItemId as number,
            mealType: plan.mealType,
            name: item.name,
            nameZh: item.nameZh,
            category: item.category,
            quantityGrams: item.quantityGrams,
            calories: item.calories,
            protein: item.protein,
            fat: item.fat,
            carbs: item.carbs,
            fiber: item.fiber
          }))
      )
    );

    toast({
      title: "AI搭配已应用",
      description: "剩余餐次已经按推荐方案加入今日记录。",
      variant: "success"
    });
  }

  return (
    <section className="space-y-3 rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">AI 帮我搭配</p>
          <h2 className="mt-1 text-lg font-semibold">剩余餐次建议</h2>
        </div>
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          AI帮我搭配今日饮食
        </button>
      </div>

      {error ? <div className="rounded-2xl bg-rose-500/10 px-4 py-4 text-sm text-rose-700 dark:text-rose-300">{error}</div> : null}

      {plans.length > 0 ? (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.title} className="rounded-[1.4rem] bg-secondary/70 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{plan.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {mealTypeLabels[plan.mealType]} · {Math.round(plan.totals.calories)} kcal
                  </p>
                </div>
                <span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold shadow-sm">
                  蛋白 {Math.round(plan.totals.protein)}g
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {plan.foods.map((food) => (
                  <div key={`${plan.title}-${food.foodItemId}`} className="flex items-center justify-between text-sm">
                    <span>{food.nameZh}</span>
                    <span className="text-muted-foreground">{food.quantityGrams}g</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={applyPlan}
            className="w-full rounded-[1.3rem] bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            一键应用推荐方案
          </button>
        </div>
      ) : null}
    </section>
  );
}
