import { AddFoodScreen } from "@/components/screens/add-food-screen";
import { prisma } from "@/lib/prisma";
import { FoodCategory, MealType, type FoodItemSummary } from "@/lib/domain";

export const dynamic = "force-dynamic";

function parseMealType(value?: string): MealType {
  switch (value?.toLowerCase()) {
    case "breakfast":
      return MealType.BREAKFAST;
    case "lunch":
      return MealType.LUNCH;
    case "dinner":
      return MealType.DINNER;
    default:
      return MealType.SNACK;
  }
}

function normalizeCategory(category: string): FoodCategory {
  if (Object.values(FoodCategory).includes(category as FoodCategory)) {
    return category as FoodCategory;
  }

  return FoodCategory.OTHER;
}

export default async function AddFoodPage({
  searchParams
}: {
  searchParams?: {
    meal?: string;
  };
}) {
  let foods: Awaited<ReturnType<typeof prisma.foodItem.findMany>> = [];

  try {
    foods = await prisma.foodItem.findMany({
      orderBy: [{ is_custom: "desc" }, { category: "asc" }, { name_zh: "asc" }]
    });
  } catch {
    foods = [];
  }

  const normalizedFoods: FoodItemSummary[] = foods.map((food) => ({
    id: food.id,
    name: food.name,
    nameZh: food.name_zh,
    category: normalizeCategory(food.category),
    caloriesPer100g: food.calories_per_100g,
    proteinPer100g: food.protein_per_100g,
    fatPer100g: food.fat_per_100g,
    carbsPer100g: food.carbs_per_100g,
    fiberPer100g: food.fiber_per_100g,
    giIndex: food.gi_index,
    imageUrl: food.image_url,
    isCustom: food.is_custom
  }));

  return <AddFoodScreen foods={normalizedFoods} mealType={parseMealType(searchParams?.meal)} />;
}
