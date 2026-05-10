"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus, LoaderCircle, Plus, Search, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { BarcodeScanner } from "@/components/tracker/barcode-scanner";
import { FoodImage } from "@/components/tracker/food-image";
import { SectionTitle } from "@/components/tracker/section-title";
import { summarizeTemplateItems, calculateFoodItemMacros } from "@/lib/calculator";
import {
  FoodCategory,
  MealType,
  type FoodItemSummary,
  type LoggedMeal,
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

function hasFoodItemId(item: MealTemplateItem): item is MealTemplateItem & { foodItemId: number } {
  return typeof item.foodItemId === "number";
}

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
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);

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
  const actionBusy = submitting || savingTemplate || applyingTemplateId !== null;

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

  function removeBasketItem(index: number) {
    setBasket((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function clearBasket() {
    setBasket([]);
  }

  async function saveCurrentTemplate() {
    const trimmedTemplateName = templateName.trim();

    if (!trimmedTemplateName) {
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
      setSavingTemplate(true);

      if (isAuthConfigured && authUser) {
        const response = await fetch("/api/meal-templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: trimmedTemplateName,
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
        saveMealTemplate(trimmedTemplateName, mealType, basket);
      }

      setTemplateName("");
      setBasket([]);
      toast({
        title: "模板已保存",
        description: `${trimmedTemplateName} 已加入你的饮食模板。`,
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "模板保存失败",
        description: error instanceof Error ? error.message : "请稍后再试。",
        variant: "error"
      });
    } finally {
      setSavingTemplate(false);
    }
  }

  async function quickApplyTemplate(templateId: string, templateNameLabel: string) {
    const template = matchingTemplates.find((entry) => entry.id === templateId);

    if (!template) {
      return;
    }

    const loggableItems = template.items.filter(hasFoodItemId);

    if (loggableItems.length === 0) {
      toast({
        title: "模板无法应用",
        description: "这个模板里没有可记录到食物库的食物。",
        variant: "error"
      });
      return;
    }

    setApplyingTemplateId(templateId);

    try {
      if (isAuthConfigured && authUser) {
        const results = await Promise.all(
          loggableItems.map(async (item) => {
            const response = await fetch("/api/meal-logs", {
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
            });

            if (!response.ok) {
              const payload = await response.json().catch(() => null);
              return {
                error: payload?.error ?? "应用模板失败"
              };
            }

            return {
              meal: (await response.json()) as LoggedMeal
            };
          })
        );

        const savedMeals = results.filter((result): result is { meal: LoggedMeal } => "meal" in result);
        const failedResult = results.find((result): result is { error: string } => "error" in result);

        savedMeals.forEach(({ meal }) => insertMealFromServer(meal));

        if (failedResult) {
          if (savedMeals.length > 0) {
            throw new Error(`已添加 ${savedMeals.length} 项，另有 ${results.length - savedMeals.length} 项保存失败。`);
          }

          throw new Error(failedResult.error);
        }
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
      setApplyingTemplateId(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 safe-px pb-44 pt-6">
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

      <Link
        href="/settings#food-library"
        className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_16px_35px_rgba(22,163,74,0.2)] lg:hidden"
      >
        <Plus className="h-4 w-4" />
        添加自定义食物
      </Link>

      {matchingTemplates.length > 0 ? (
        <section className="space-y-3">
          <SectionTitle title="饮食模板" />
          <div className="flex gap-3 overflow-x-auto pb-1">
            {matchingTemplates.map((template) => (
              <div
                key={template.id}
                className="min-w-[13rem] rounded-[1.4rem] bg-white/72 px-4 py-4 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5"
              >
                <p className="truncate font-semibold">{template.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {template.items.length} 个食物 · {Math.round(summarizeTemplateItems(template.items).calories)} kcal
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3 w-full rounded-full"
                  disabled={actionBusy}
                  onClick={() => void quickApplyTemplate(template.id, template.name)}
                >
                  {applyingTemplateId === template.id ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  应用模板
                </Button>
              </div>
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
                  "min-w-[10rem] rounded-[1.4rem] bg-white/72 p-3 text-left shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5",
                  selectedFoodId === food.id && "ring-2 ring-primary"
                )}
              >
                <FoodImage food={food} className="mb-3 h-20 rounded-[1.05rem]" />
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
                "flex items-center gap-3 rounded-[1.5rem] bg-white/72 p-3 text-left shadow-sm ring-1 ring-black/5 transition-all dark:bg-white/5 dark:ring-white/5",
                selectedFoodId === food.id && "ring-2 ring-primary"
              )}
            >
              <FoodImage food={food} className="h-16 w-16 shrink-0 rounded-[1.05rem]" />
              <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{food.nameZh}</p>
                  <p className="text-xs text-muted-foreground">{foodCategoryLabels[food.category]}</p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
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
          <div className="flex items-center justify-between gap-3">
            <SectionTitle title="当前模板组合" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 rounded-full text-muted-foreground hover:text-destructive"
              disabled={savingTemplate}
              onClick={clearBasket}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              清空组合
            </Button>
          </div>
          <div className="space-y-2">
            {basket.map((item, index) => (
              <div
                key={`${item.foodItemId}-${index}`}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-2xl bg-secondary/70 px-3 py-3 text-sm"
              >
                <span className="truncate font-medium">{item.nameZh}</span>
                <span className="whitespace-nowrap text-muted-foreground">{item.quantityGrams}g</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                  disabled={savingTemplate}
                  onClick={() => removeBasketItem(index)}
                  aria-label={`移除${item.nameZh}`}
                >
                  <X className="h-4 w-4" />
                </Button>
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
            <Button
              className="rounded-[1.2rem]"
              onClick={() => void saveCurrentTemplate()}
              disabled={actionBusy || basket.length === 0 || !templateName.trim()}
            >
              {savingTemplate ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BookmarkPlus className="mr-2 h-4 w-4" />
              )}
              {savingTemplate ? "保存中" : "保存模板"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            当前组合 {basket.length} 项 · {Math.round(basketSummary.calories)} kcal
          </p>
        </section>
      ) : null}

      {selectedFood ? (
        <section className="sticky bottom-32 space-y-3 rounded-[1.8rem] bg-white/92 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-white/80 backdrop-blur-xl dark:bg-slate-900/88 dark:ring-white/5 sm:space-y-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <FoodImage food={selectedFood} className="h-16 w-16 shrink-0 rounded-[1.1rem] sm:h-20 sm:w-20 sm:rounded-[1.25rem]" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{scannedFood?.id === selectedFood.id ? "扫码识别结果" : "已选择"}</p>
                <h2 className="truncate text-xl font-semibold">{selectedFood.nameZh}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{foodCategoryLabels[selectedFood.category]}</p>
              </div>
            </div>
            <p className="shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-semibold">{quantity[0]}g</p>
          </div>
          <div className="space-y-3">
            <Slider value={quantity} min={20} max={500} step={10} onValueChange={setQuantity} />
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <div className="rounded-2xl bg-secondary p-2 sm:p-3">
                <p className="text-[11px] text-muted-foreground sm:text-xs">热量</p>
                <p className="mt-1 whitespace-nowrap text-[13px] font-semibold sm:text-base">{Math.round(macroPreview.calories)} kcal</p>
              </div>
              <div className="rounded-2xl bg-secondary p-2 sm:p-3">
                <p className="text-[11px] text-muted-foreground sm:text-xs">蛋白质</p>
                <p className="mt-1 whitespace-nowrap text-[13px] font-semibold sm:text-base">{Math.round(macroPreview.protein)}g</p>
              </div>
              <div className="rounded-2xl bg-secondary p-2 sm:p-3">
                <p className="text-[11px] text-muted-foreground sm:text-xs">脂肪</p>
                <p className="mt-1 whitespace-nowrap text-[13px] font-semibold sm:text-base">{Math.round(macroPreview.fat)}g</p>
              </div>
              <div className="rounded-2xl bg-secondary p-2 sm:p-3">
                <p className="text-[11px] text-muted-foreground sm:text-xs">碳水</p>
                <p className="mt-1 whitespace-nowrap text-[13px] font-semibold sm:text-base">{Math.round(macroPreview.carbs)}g</p>
              </div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" className="h-11 rounded-[1.3rem] text-sm sm:h-12" onClick={addToBasket} disabled={actionBusy}>
              加入模板组合
            </Button>
            <Button className="h-11 rounded-[1.3rem] text-sm sm:h-12" onClick={() => void submitMeal()} disabled={actionBusy}>
              {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submitting ? "保存中" : `添加到${mealTypeLabels[mealType]}`}
            </Button>
          </div>
        </section>
      ) : null}

      <Link
        href="/settings#food-library"
        className="fixed bottom-28 right-5 hidden items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_16px_35px_rgba(22,163,74,0.28)] lg:inline-flex"
      >
        <Plus className="h-4 w-4" />
        添加自定义食物
      </Link>
    </div>
  );
}
