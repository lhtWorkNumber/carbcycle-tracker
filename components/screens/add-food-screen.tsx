"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { BarcodeScanner } from "@/components/tracker/barcode-scanner";
import { SectionTitle } from "@/components/tracker/section-title";
import { summarizeTemplateItems, calculateFoodItemMacros } from "@/lib/calculator";
import {
  FoodCategory,
  MealType,
  type FoodItemSummary,
  type MealTemplateItem
} from "@/lib/domain";
import { getMondayFirstDayIndex } from "@/lib/format";
import { dayTypeMeta, foodCategoryLabels, mealTypeLabels } from "@/lib/ui-config";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { useTrackerStore } from "@/store/tracker-store";

const filterTabs = [
  FoodCategory.STAPLE,
  FoodCategory.MEAT,
  FoodCategory.VEGETABLE,
  FoodCategory.FRUIT,
  FoodCategory.DAIRY,
  FoodCategory.SNACK
] as const;

export function AddFoodScreen({
  foods,
  mealType
}: {
  foods: FoodItemSummary[];
  mealType: MealType;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const addMeal = useTrackerStore((state) => state.addMeal);
  const insertMealFromServer = useTrackerStore((state) => state.insertMealFromServer);
  const recentFoodIds = useTrackerStore((state) => state.recentFoodIds);
  const mealTemplates = useTrackerStore((state) => state.mealTemplates);
  const saveMealTemplate = useTrackerStore((state) => state.saveMealTemplate);
  const insertMealTemplateFromServer = useTrackerStore((state) => state.insertMealTemplateFromServer);
  const applyMealTemplate = useTrackerStore((state) => state.applyMealTemplate);
  const selectedDate = useTrackerStore((state) => state.selectedDate);
  const weeklyPlan = useTrackerStore((state) => state.weeklyPlan);
  const authUser = useAuthStore((state) => state.user);
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState<FoodCategory | "ALL">("ALL");
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(recentFoodIds[0] ?? foods[0]?.id ?? null);
  const [quantity, setQuantity] = useState([150]);
  const [templateName, setTemplateName] = useState("");
  const [basket, setBasket] = useState<MealTemplateItem[]>([]);
  const [scannedFood, setScannedFood] = useState<FoodItemSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const dayIndex = getMondayFirstDayIndex(selectedDate);
  const todayDayType = weeklyPlan.days[dayIndex]?.dayType ?? weeklyPlan.days[0]?.dayType;

  const availableFoods = useMemo(
    () => (scannedFood ? [scannedFood, ...foods.filter((food) => food.id !== scannedFood.id)] : foods),
    [foods, scannedFood]
  );

  const recentFoods = recentFoodIds
    .map((foodId) => availableFoods.find((food) => food.id === foodId))
    .filter((food): food is FoodItemSummary => Boolean(food));

  const filteredFoods = availableFoods.filter((food) => {
    const matchesCategory = category === "ALL" ? true : food.category === category;
    const keyword = deferredSearch.trim().toLowerCase();
    const matchesSearch =
      keyword.length === 0 ||
      food.nameZh.toLowerCase().includes(keyword) ||
      food.name.toLowerCase().includes(keyword);

    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    if (!selectedFoodId && filteredFoods[0]) {
      setSelectedFoodId(filteredFoods[0].id);
      return;
    }

    if (selectedFoodId && !availableFoods.some((food) => food.id === selectedFoodId) && filteredFoods[0]) {
      setSelectedFoodId(filteredFoods[0].id);
    }
  }, [filteredFoods, availableFoods, selectedFoodId]);

  const selectedFood =
    availableFoods.find((food) => food.id === selectedFoodId) ??
    recentFoods[0] ??
    filteredFoods[0] ??
    null;

  const macroPreview = selectedFood
    ? calculateFoodItemMacros(
        {
          id: selectedFood.id,
          caloriesPer100g: selectedFood.caloriesPer100g,
          proteinPer100g: selectedFood.proteinPer100g,
          fatPer100g: selectedFood.fatPer100g,
          carbsPer100g: selectedFood.carbsPer100g,
          fiberPer100g: selectedFood.fiberPer100g
        },
        quantity[0]
      )
    : { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };

  const matchingTemplates = useMemo(
    () =>
      mealTemplates.filter(
        (template) =>
          template.mealType === mealType &&
          (template.dayTypes?.length ? (todayDayType ? template.dayTypes.includes(todayDayType) : true) : true)
      ),
    [mealTemplates, mealType, todayDayType]
  );

  const basketSummary = summarizeTemplateItems(basket);

  async function submitMeal() {
    if (!selectedFood) {
      return;
    }

    setSubmitting(true);

    try {
      if (isAuthConfigured && authUser) {
        const response = await fetch("/api/meal-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            food_item_id: selectedFood.id,
            meal_type: mealType,
            quantity_grams: quantity[0],
            date: new Date(`${selectedDate}T12:00:00.000Z`).toISOString()
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "保存餐食记录失败");
        }

        const meal = await response.json();
        insertMealFromServer(meal);
      } else {
        addMeal({
          foodItemId: selectedFood.id,
          mealType,
          name: selectedFood.name,
          nameZh: selectedFood.nameZh,
          category: selectedFood.category,
          quantityGrams: quantity[0],
          calories: macroPreview.calories,
          protein: macroPreview.protein,
          fat: macroPreview.fat,
          carbs: macroPreview.carbs,
          fiber: macroPreview.fiber
        });
      }

      toast({
        title: "已添加到餐次",
        description: `${selectedFood.nameZh} 已加入 ${mealTypeLabels[mealType]}。`,
        variant: "success"
      });
      router.push("/");
    } catch (error) {
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "请稍后再试。",
        variant: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  function addToBasket() {
    if (!selectedFood) {
      return;
    }

    const item: MealTemplateItem = {
      foodItemId: selectedFood.id,
      name: selectedFood.name,
      nameZh: selectedFood.nameZh,
      category: selectedFood.category,
      quantityGrams: quantity[0],
      calories: macroPreview.calories,
      protein: macroPreview.protein,
      fat: macroPreview.fat,
      carbs: macroPreview.carbs,
      fiber: macroPreview.fiber
    };

    setBasket((current) => [...current, item]);
    toast({
      title: "已加入模板组合",
      description: `${selectedFood.nameZh} 已加入当前组合。`,
      variant: "success"
    });
  }

  async function saveCurrentTemplate() {
    if (!templateName.trim()) {
      toast({
        title: "请输入模板名称",
        description: "保存模板前需要先命名。",
        variant: "error"
      });
      return;
    }

    if (basket.length === 0) {
      toast({
        title: "模板为空",
        description: "先把食物加入组合，再保存模板。",
        variant: "error"
      });
      return;
    }

    try {
      if (isAuthConfigured && authUser) {
        const response = await fetch("/api/meal-templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: templateName.trim(),
            mealType,
            items: basket
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "保存模板失败");
        }

        const template = await response.json();
        insertMealTemplateFromServer(template);
      } else {
        saveMealTemplate(templateName.trim(), mealType, basket);
      }

      setTemplateName("");
      setBasket([]);
      toast({
        title: "模板已保存",
        description: `${templateName.trim()} 已加入你的饮食模板。`,
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "模板保存失败",
        description: error instanceof Error ? error.message : "请稍后再试。",
        variant: "error"
      });
    }
  }

  async function quickApplyTemplate(templateId: string, templateNameLabel: string) {
    const template = matchingTemplates.find((entry) => entry.id === templateId);

    if (!template) {
      return;
    }

    setSubmitting(true);

    try {
      if (isAuthConfigured && authUser) {
        const responses = await Promise.all(
          template.items.map((item) =>
            fetch("/api/meal-logs", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                food_item_id: item.foodItemId,
                meal_type: template.mealType,
                quantity_grams: item.quantityGrams,
                date: new Date(`${selectedDate}T12:00:00.000Z`).toISOString()
              })
            })
          )
        );

        for (const response of responses) {
          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            throw new Error(payload?.error ?? "应用模板失败");
          }
        }

        const meals = await Promise.all(responses.map((response) => response.json()));
        meals.forEach((meal) => insertMealFromServer(meal));
      } else {
        applyMealTemplate(templateId);
      }

      toast({
        title: "模板已应用",
        description: `${templateNameLabel} 已一键加入当前餐次。`,
        variant: "success"
      });
      router.push("/");
    } catch (error) {
      toast({
        title: "模板应用失败",
        description: error instanceof Error ? error.message : "请稍后再试。",
        variant: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 safe-px pb-32 pt-6">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">添加到 {mealTypeLabels[mealType]}</p>
          {todayDayType ? (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${dayTypeMeta[todayDayType].badgeClass}`}>
              {dayTypeMeta[todayDayType].shortLabel}
            </span>
          ) : null}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">选择食物</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索食物名称"
            className="h-12 rounded-[1.4rem] border-none bg-white/72 pl-11 shadow-sm dark:bg-white/5"
          />
        </div>
      </section>

      <BarcodeScanner
        onFoodDetected={(food) => {
          setScannedFood(food);
          setSelectedFoodId(food.id);
        }}
      />

      {matchingTemplates.length > 0 ? (
        <section className="space-y-3">
          <SectionTitle title="饮食模板" />
          <div className="flex gap-3 overflow-x-auto pb-1">
            {matchingTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => quickApplyTemplate(template.id, template.name)}
                className="min-w-[13rem] rounded-[1.4rem] bg-white/72 px-4 py-4 text-left shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5"
              >
                <p className="font-semibold">{template.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {template.items.length} 个食物 · {Math.round(summarizeTemplateItems(template.items).calories)} kcal
                </p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {recentFoods.length > 0 ? (
        <section className="space-y-3">
          <SectionTitle title="最近常吃" />
          <div className="flex gap-3 overflow-x-auto pb-1">
            {recentFoods.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => setSelectedFoodId(food.id)}
                className={cn(
                  "min-w-[9rem] rounded-[1.4rem] bg-white/72 px-4 py-4 text-left shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5",
                  selectedFoodId === food.id && "ring-2 ring-primary"
                )}
              >
                <p className="font-semibold">{food.nameZh}</p>
                <p className="mt-1 text-xs text-muted-foreground">{Math.round(food.caloriesPer100g)} kcal / 100g</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory("ALL")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium",
              category === "ALL" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}
          >
            全部
          </button>
          {filterTabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium",
                category === item ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              )}
            >
              {foodCategoryLabels[item]}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredFoods.map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => setSelectedFoodId(food.id)}
              className={cn(
                "rounded-[1.5rem] bg-white/72 px-4 py-4 text-left shadow-sm ring-1 ring-black/5 transition-all dark:bg-white/5 dark:ring-white/5",
                selectedFoodId === food.id && "ring-2 ring-primary"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{food.nameZh}</p>
                  <p className="text-xs text-muted-foreground">{foodCategoryLabels[food.category]}</p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                  {Math.round(food.caloriesPer100g)} kcal/100g
                </span>
              </div>
            </button>
          ))}
        </div>
        {filteredFoods.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            没有找到匹配食物，可以换个关键词，或从右下角添加自定义食物。
          </div>
        ) : null}
      </section>

      {basket.length > 0 ? (
        <section className="space-y-3 rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
          <SectionTitle title="当前模板组合" />
          <div className="space-y-2">
            {basket.map((item, index) => (
              <div key={`${item.foodItemId}-${index}`} className="flex items-center justify-between rounded-2xl bg-secondary/70 px-3 py-3 text-sm">
                <span>{item.nameZh}</span>
                <span className="text-muted-foreground">{item.quantityGrams}g</span>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder="例如：我的早餐模板"
              className="h-11 rounded-[1.2rem]"
            />
            <Button className="rounded-[1.2rem]" onClick={() => void saveCurrentTemplate()}>
              <BookmarkPlus className="mr-2 h-4 w-4" />
              保存模板
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            当前组合 {basket.length} 项 · {Math.round(basketSummary.calories)} kcal
          </p>
        </section>
      ) : null}

      {selectedFood ? (
        <section className="sticky bottom-24 space-y-4 rounded-[1.8rem] bg-white/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-white/80 backdrop-blur-xl dark:bg-slate-900/88 dark:ring-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{scannedFood?.id === selectedFood.id ? "扫码识别结果" : "已选择"}</p>
              <h2 className="text-xl font-semibold">{selectedFood.nameZh}</h2>
            </div>
            <p className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">{quantity[0]}g</p>
          </div>
          <div className="space-y-3">
            <Slider value={quantity} min={20} max={500} step={10} onValueChange={setQuantity} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-secondary p-3">
                <p className="text-xs text-muted-foreground">热量</p>
                <p className="mt-1 font-semibold">{Math.round(macroPreview.calories)} kcal</p>
              </div>
              <div className="rounded-2xl bg-secondary p-3">
                <p className="text-xs text-muted-foreground">蛋白质</p>
                <p className="mt-1 font-semibold">{Math.round(macroPreview.protein)}g</p>
              </div>
              <div className="rounded-2xl bg-secondary p-3">
                <p className="text-xs text-muted-foreground">脂肪</p>
                <p className="mt-1 font-semibold">{Math.round(macroPreview.fat)}g</p>
              </div>
              <div className="rounded-2xl bg-secondary p-3">
                <p className="text-xs text-muted-foreground">碳水</p>
                <p className="mt-1 font-semibold">{Math.round(macroPreview.carbs)}g</p>
              </div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" className="h-12 rounded-[1.3rem]" onClick={addToBasket} disabled={submitting}>
              加入模板组合
            </Button>
            <Button className="h-12 rounded-[1.3rem]" onClick={() => void submitMeal()} disabled={submitting}>
              {submitting ? "保存中…" : `添加到${mealTypeLabels[mealType]}`}
            </Button>
          </div>
        </section>
      ) : null}

      <Link
        href="/settings#food-library"
        className="fixed bottom-28 right-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_16px_35px_rgba(22,163,74,0.28)]"
      >
        <Plus className="h-4 w-4" />
        添加自定义食物
      </Link>
    </div>
  );
}
