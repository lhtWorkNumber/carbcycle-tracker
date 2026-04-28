"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, Sparkles } from "lucide-react";

import { suggestFoodsByRemainingMacros } from "@/lib/calculator";
import { FoodCategory, type FoodItemSummary, type RemainingMacros } from "@/lib/domain";
import { foodCategoryLabels } from "@/lib/ui-config";

export function SmartSuggestion({
  remainingMacros
}: {
  remainingMacros: RemainingMacros;
}) {
  const [foods, setFoods] = useState<FoodItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFoods() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/food-items");

        if (!response.ok) {
          throw new Error("加载食物库失败");
        }

        const result = await response.json();

        if (!active) {
          return;
        }

        const normalizedFoods: FoodItemSummary[] = result.map((food: any) => ({
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

        setFoods(normalizedFoods);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "推荐加载失败");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFoods();

    return () => {
      active = false;
    };
  }, []);

  const suggestions = suggestFoodsByRemainingMacros(remainingMacros, foods, 4);

  return (
    <section className="space-y-3 rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold">智能推荐</h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-4 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          正在根据今日剩余营养推荐食物…
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-500/10 px-4 py-4 text-sm text-rose-700 dark:text-rose-300">{error}</div>
      ) : suggestions.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((food) => (
            <Link
              key={food.id}
              href="/add-food?meal=snack"
              className="rounded-[1.35rem] bg-secondary/70 px-4 py-4 transition-colors hover:bg-secondary"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{food.nameZh}</p>
                  <p className="text-xs text-muted-foreground">{foodCategoryLabels[food.category]}</p>
                </div>
                <span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold shadow-sm">
                  {Math.round(food.caloriesPer100g)} kcal
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{food.reason}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-secondary px-4 py-4 text-sm text-muted-foreground">
          当前剩余宏量已经比较接近目标，继续保持就好。
        </div>
      )}
    </section>
  );
}
