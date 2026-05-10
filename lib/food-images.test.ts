import { describe, expect, it } from "vitest";

import { FoodCategory, type FoodItemSummary } from "@/lib/domain";
import { getExactFoodImageUrl, getFoodImageUrlCandidates } from "@/lib/food-images";

function food(overrides: Partial<FoodItemSummary>): FoodItemSummary {
  return {
    id: 1,
    name: "Food",
    nameZh: "食物",
    category: FoodCategory.OTHER,
    caloriesPer100g: 0,
    proteinPer100g: 0,
    fatPer100g: 0,
    carbsPer100g: 0,
    fiberPer100g: 0,
    imageUrl: null,
    isCustom: false,
    ...overrides
  };
}

describe("getExactFoodImageUrl", () => {
  it("prefers an explicit image URL from custom or scanned foods", () => {
    expect(
      getExactFoodImageUrl(
        food({
          name: "Milk",
          nameZh: "牛奶",
          imageUrl: "https://example.com/custom-food.jpg"
        })
      )
    ).toBe("https://example.com/custom-food.jpg");
  });

  it("uses the soy milk photo instead of the milk photo", () => {
    expect(
      getExactFoodImageUrl(
        food({
          name: "Unsweetened Soy Milk",
          nameZh: "无糖豆浆",
          category: FoodCategory.BEVERAGE
        })
      )
    ).toContain("photo-1555465083-a845797ef750");
  });

  it("uses a specific brown rice photo instead of the white rice photo", () => {
    expect(
      getExactFoodImageUrl(
        food({
          name: "Brown Rice",
          nameZh: "糙米饭",
          category: FoodCategory.STAPLE
        })
      )
    ).toContain("photo-1586201375761-83865001e31c");
  });

  it("uses a specific cottage cheese photo before the generic cheese photo", () => {
    expect(
      getExactFoodImageUrl(
        food({
          name: "Cottage Cheese",
          nameZh: "茅屋奶酪",
          category: FoodCategory.DAIRY
        })
      )
    ).toContain("photo-1753173301157-8136a70b4178");
  });

  it("uses a wood ear mushroom image rule before the generic mushroom fallback", () => {
    expect(
      getExactFoodImageUrl(
        food({
          name: "Wood Ear Mushroom",
          nameZh: "木耳",
          category: FoodCategory.OTHER
        })
      )
    ).toContain("photo-1504545102780-26774c1bb073");
  });

  it("returns explicit and curated candidates for image fallback", () => {
    expect(
      getFoodImageUrlCandidates(
        food({
          name: "Milk",
          nameZh: "牛奶",
          imageUrl: "https://example.com/missing.jpg"
        })
      )
    ).toEqual([
      "https://example.com/missing.jpg",
      expect.stringContaining("photo-1550583724-b2692b85b150")
    ]);
  });
});
