import { SettingsScreen } from "@/components/screens/settings-screen";
import { prisma } from "@/lib/prisma";
import { FoodCategory, type FoodItemSummary } from "@/lib/domain";

export const dynamic = "force-dynamic";

function normalizeCategory(category: string): FoodCategory {
  if (Object.values(FoodCategory).includes(category as FoodCategory)) {
    return category as FoodCategory;
  }

  return FoodCategory.OTHER;
}

export default async function SettingsPage() {
  let customFoods: Awaited<ReturnType<typeof prisma.foodItem.findMany>> = [];

  try {
    customFoods = await prisma.foodItem.findMany({
      where: {
        is_custom: true
      },
      orderBy: {
        id: "desc"
      }
    });
  } catch {
    customFoods = [];
  }

  const normalizedFoods: FoodItemSummary[] = customFoods.map((food) => ({
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

  return <SettingsScreen initialCustomFoods={normalizedFoods} />;
}
