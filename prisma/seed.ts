import { FoodCategory, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const foodItems = [
  { name: "White Rice", name_zh: "米饭", category: FoodCategory.STAPLE, calories_per_100g: 116, protein_per_100g: 2.6, fat_per_100g: 0.3, carbs_per_100g: 25.9, fiber_per_100g: 0.3, gi_index: 83 },
  { name: "Steamed Bun", name_zh: "馒头", category: FoodCategory.STAPLE, calories_per_100g: 223, protein_per_100g: 7.0, fat_per_100g: 1.1, carbs_per_100g: 45.1, fiber_per_100g: 1.5, gi_index: 88 },
  { name: "Sweet Potato", name_zh: "红薯", category: FoodCategory.STAPLE, calories_per_100g: 86, protein_per_100g: 1.6, fat_per_100g: 0.1, carbs_per_100g: 20.1, fiber_per_100g: 3.0, gi_index: 61 },
  { name: "Oats", name_zh: "燕麦", category: FoodCategory.STAPLE, calories_per_100g: 389, protein_per_100g: 16.9, fat_per_100g: 6.9, carbs_per_100g: 66.3, fiber_per_100g: 10.6, gi_index: 55 },
  { name: "Whole Wheat Bread", name_zh: "全麦面包", category: FoodCategory.STAPLE, calories_per_100g: 247, protein_per_100g: 12.5, fat_per_100g: 4.2, carbs_per_100g: 41.2, fiber_per_100g: 6.8, gi_index: 69 },
  { name: "Brown Rice", name_zh: "糙米饭", category: FoodCategory.STAPLE, calories_per_100g: 111, protein_per_100g: 2.6, fat_per_100g: 0.9, carbs_per_100g: 23.0, fiber_per_100g: 1.8, gi_index: 50 },
  { name: "Corn", name_zh: "玉米", category: FoodCategory.STAPLE, calories_per_100g: 96, protein_per_100g: 3.4, fat_per_100g: 1.5, carbs_per_100g: 21.0, fiber_per_100g: 2.4, gi_index: 52 },
  { name: "Pumpkin", name_zh: "南瓜", category: FoodCategory.STAPLE, calories_per_100g: 26, protein_per_100g: 1.0, fat_per_100g: 0.1, carbs_per_100g: 6.5, fiber_per_100g: 0.5, gi_index: 64 },
  { name: "Rice Noodles", name_zh: "米粉", category: FoodCategory.STAPLE, calories_per_100g: 109, protein_per_100g: 1.8, fat_per_100g: 0.2, carbs_per_100g: 24.9, fiber_per_100g: 0.5, gi_index: 58 },
  { name: "Whole Wheat Noodles", name_zh: "全麦面", category: FoodCategory.STAPLE, calories_per_100g: 284, protein_per_100g: 12.2, fat_per_100g: 2.0, carbs_per_100g: 56.0, fiber_per_100g: 7.4, gi_index: 46 },
  { name: "Chicken Breast", name_zh: "鸡胸肉", category: FoodCategory.MEAT, calories_per_100g: 165, protein_per_100g: 31.0, fat_per_100g: 3.6, carbs_per_100g: 0.0, fiber_per_100g: 0.0 },
  { name: "Lean Beef", name_zh: "牛肉", category: FoodCategory.MEAT, calories_per_100g: 187, protein_per_100g: 20.4, fat_per_100g: 11.2, carbs_per_100g: 0.0, fiber_per_100g: 0.0 },
  { name: "Salmon", name_zh: "三文鱼", category: FoodCategory.MEAT, calories_per_100g: 208, protein_per_100g: 20.4, fat_per_100g: 13.4, carbs_per_100g: 0.0, fiber_per_100g: 0.0 },
  { name: "Shrimp", name_zh: "虾", category: FoodCategory.MEAT, calories_per_100g: 99, protein_per_100g: 24.0, fat_per_100g: 0.3, carbs_per_100g: 0.2, fiber_per_100g: 0.0 },
  { name: "Egg", name_zh: "鸡蛋", category: FoodCategory.MEAT, calories_per_100g: 144, protein_per_100g: 12.6, fat_per_100g: 9.5, carbs_per_100g: 1.1, fiber_per_100g: 0.0 },
  { name: "Pork Tenderloin", name_zh: "里脊肉", category: FoodCategory.MEAT, calories_per_100g: 143, protein_per_100g: 21.0, fat_per_100g: 6.1, carbs_per_100g: 0.0, fiber_per_100g: 0.0 },
  { name: "Cod", name_zh: "鳕鱼", category: FoodCategory.MEAT, calories_per_100g: 82, protein_per_100g: 17.8, fat_per_100g: 0.7, carbs_per_100g: 0.0, fiber_per_100g: 0.0 },
  { name: "Tuna", name_zh: "金枪鱼", category: FoodCategory.MEAT, calories_per_100g: 132, protein_per_100g: 28.0, fat_per_100g: 1.3, carbs_per_100g: 0.0, fiber_per_100g: 0.0 },
  { name: "Duck Breast", name_zh: "鸭胸肉", category: FoodCategory.MEAT, calories_per_100g: 201, protein_per_100g: 18.3, fat_per_100g: 13.5, carbs_per_100g: 0.0, fiber_per_100g: 0.0 },
  { name: "Tofu", name_zh: "豆腐", category: FoodCategory.OTHER, calories_per_100g: 81, protein_per_100g: 8.1, fat_per_100g: 4.8, carbs_per_100g: 1.9, fiber_per_100g: 0.3, gi_index: 15 },
  { name: "Broccoli", name_zh: "西兰花", category: FoodCategory.VEGETABLE, calories_per_100g: 34, protein_per_100g: 2.8, fat_per_100g: 0.4, carbs_per_100g: 6.6, fiber_per_100g: 2.6, gi_index: 15 },
  { name: "Spinach", name_zh: "菠菜", category: FoodCategory.VEGETABLE, calories_per_100g: 23, protein_per_100g: 2.9, fat_per_100g: 0.4, carbs_per_100g: 3.6, fiber_per_100g: 2.2, gi_index: 15 },
  { name: "Tomato", name_zh: "番茄", category: FoodCategory.VEGETABLE, calories_per_100g: 18, protein_per_100g: 0.9, fat_per_100g: 0.2, carbs_per_100g: 3.9, fiber_per_100g: 1.2, gi_index: 15 },
  { name: "Cucumber", name_zh: "黄瓜", category: FoodCategory.VEGETABLE, calories_per_100g: 15, protein_per_100g: 0.7, fat_per_100g: 0.1, carbs_per_100g: 3.6, fiber_per_100g: 0.5, gi_index: 15 },
  { name: "Lettuce", name_zh: "生菜", category: FoodCategory.VEGETABLE, calories_per_100g: 15, protein_per_100g: 1.4, fat_per_100g: 0.2, carbs_per_100g: 2.9, fiber_per_100g: 1.3, gi_index: 15 },
  { name: "Bok Choy", name_zh: "小白菜", category: FoodCategory.VEGETABLE, calories_per_100g: 13, protein_per_100g: 1.5, fat_per_100g: 0.2, carbs_per_100g: 2.2, fiber_per_100g: 1.0, gi_index: 10 },
  { name: "Chinese Cabbage", name_zh: "大白菜", category: FoodCategory.VEGETABLE, calories_per_100g: 17, protein_per_100g: 1.2, fat_per_100g: 0.2, carbs_per_100g: 3.2, fiber_per_100g: 1.2, gi_index: 10 },
  { name: "Carrot", name_zh: "胡萝卜", category: FoodCategory.VEGETABLE, calories_per_100g: 41, protein_per_100g: 0.9, fat_per_100g: 0.2, carbs_per_100g: 9.6, fiber_per_100g: 2.8, gi_index: 39 },
  { name: "Bell Pepper", name_zh: "彩椒", category: FoodCategory.VEGETABLE, calories_per_100g: 31, protein_per_100g: 1.0, fat_per_100g: 0.3, carbs_per_100g: 6.0, fiber_per_100g: 2.1, gi_index: 15 },
  { name: "Mushroom", name_zh: "蘑菇", category: FoodCategory.VEGETABLE, calories_per_100g: 22, protein_per_100g: 3.1, fat_per_100g: 0.3, carbs_per_100g: 3.3, fiber_per_100g: 1.0, gi_index: 10 },
  { name: "Apple", name_zh: "苹果", category: FoodCategory.FRUIT, calories_per_100g: 52, protein_per_100g: 0.3, fat_per_100g: 0.2, carbs_per_100g: 13.8, fiber_per_100g: 2.4, gi_index: 36 },
  { name: "Banana", name_zh: "香蕉", category: FoodCategory.FRUIT, calories_per_100g: 89, protein_per_100g: 1.1, fat_per_100g: 0.3, carbs_per_100g: 22.8, fiber_per_100g: 2.6, gi_index: 51 },
  { name: "Blueberry", name_zh: "蓝莓", category: FoodCategory.FRUIT, calories_per_100g: 57, protein_per_100g: 0.7, fat_per_100g: 0.3, carbs_per_100g: 14.5, fiber_per_100g: 2.4, gi_index: 53 },
  { name: "Avocado", name_zh: "牛油果", category: FoodCategory.FRUIT, calories_per_100g: 160, protein_per_100g: 2.0, fat_per_100g: 14.7, carbs_per_100g: 8.5, fiber_per_100g: 6.7, gi_index: 10 },
  { name: "Orange", name_zh: "橙子", category: FoodCategory.FRUIT, calories_per_100g: 47, protein_per_100g: 0.9, fat_per_100g: 0.1, carbs_per_100g: 11.8, fiber_per_100g: 2.4, gi_index: 43 },
  { name: "Strawberry", name_zh: "草莓", category: FoodCategory.FRUIT, calories_per_100g: 32, protein_per_100g: 0.7, fat_per_100g: 0.3, carbs_per_100g: 7.7, fiber_per_100g: 2.0, gi_index: 41 },
  { name: "Kiwi", name_zh: "猕猴桃", category: FoodCategory.FRUIT, calories_per_100g: 61, protein_per_100g: 1.1, fat_per_100g: 0.5, carbs_per_100g: 14.7, fiber_per_100g: 3.0, gi_index: 50 },
  { name: "Grapefruit", name_zh: "西柚", category: FoodCategory.FRUIT, calories_per_100g: 42, protein_per_100g: 0.8, fat_per_100g: 0.1, carbs_per_100g: 10.7, fiber_per_100g: 1.6, gi_index: 25 },
  { name: "Pear", name_zh: "梨", category: FoodCategory.FRUIT, calories_per_100g: 57, protein_per_100g: 0.4, fat_per_100g: 0.1, carbs_per_100g: 15.2, fiber_per_100g: 3.1, gi_index: 38 },
  { name: "Milk", name_zh: "牛奶", category: FoodCategory.DAIRY, calories_per_100g: 61, protein_per_100g: 3.2, fat_per_100g: 3.3, carbs_per_100g: 4.8, fiber_per_100g: 0.0, gi_index: 31 },
  { name: "Greek Yogurt", name_zh: "酸奶", category: FoodCategory.DAIRY, calories_per_100g: 97, protein_per_100g: 9.0, fat_per_100g: 5.0, carbs_per_100g: 4.0, fiber_per_100g: 0.0, gi_index: 35 },
  { name: "Whey Protein", name_zh: "乳清蛋白粉", category: FoodCategory.DAIRY, calories_per_100g: 402, protein_per_100g: 78.0, fat_per_100g: 7.0, carbs_per_100g: 8.0, fiber_per_100g: 0.0, gi_index: 25 },
  { name: "Cottage Cheese", name_zh: "茅屋奶酪", category: FoodCategory.DAIRY, calories_per_100g: 98, protein_per_100g: 11.1, fat_per_100g: 4.3, carbs_per_100g: 3.4, fiber_per_100g: 0.0, gi_index: 10 },
  { name: "Low-fat Cheese", name_zh: "低脂奶酪", category: FoodCategory.DAIRY, calories_per_100g: 173, protein_per_100g: 24.0, fat_per_100g: 7.0, carbs_per_100g: 3.1, fiber_per_100g: 0.0, gi_index: 0 },
  { name: "Unsweetened Soy Milk", name_zh: "无糖豆浆", category: FoodCategory.BEVERAGE, calories_per_100g: 33, protein_per_100g: 3.0, fat_per_100g: 1.8, carbs_per_100g: 1.6, fiber_per_100g: 0.3, gi_index: 34 },
  { name: "Black Coffee", name_zh: "黑咖啡", category: FoodCategory.BEVERAGE, calories_per_100g: 2, protein_per_100g: 0.1, fat_per_100g: 0.0, carbs_per_100g: 0.0, fiber_per_100g: 0.0, gi_index: 0 },
  { name: "Green Tea", name_zh: "绿茶", category: FoodCategory.BEVERAGE, calories_per_100g: 1, protein_per_100g: 0.2, fat_per_100g: 0.0, carbs_per_100g: 0.0, fiber_per_100g: 0.0, gi_index: 0 },
  { name: "Almond", name_zh: "杏仁", category: FoodCategory.SNACK, calories_per_100g: 579, protein_per_100g: 21.2, fat_per_100g: 49.9, carbs_per_100g: 21.6, fiber_per_100g: 12.5, gi_index: 15 },
  { name: "Walnut", name_zh: "核桃", category: FoodCategory.SNACK, calories_per_100g: 654, protein_per_100g: 15.2, fat_per_100g: 65.2, carbs_per_100g: 13.7, fiber_per_100g: 6.7, gi_index: 15 },
  { name: "Cashew", name_zh: "腰果", category: FoodCategory.SNACK, calories_per_100g: 553, protein_per_100g: 18.2, fat_per_100g: 43.9, carbs_per_100g: 30.2, fiber_per_100g: 3.3, gi_index: 27 },
  { name: "Edamame", name_zh: "毛豆", category: FoodCategory.SNACK, calories_per_100g: 121, protein_per_100g: 11.9, fat_per_100g: 5.2, carbs_per_100g: 8.9, fiber_per_100g: 5.2, gi_index: 18 },
  { name: "Lotus Root", name_zh: "莲藕", category: FoodCategory.OTHER, calories_per_100g: 74, protein_per_100g: 2.6, fat_per_100g: 0.1, carbs_per_100g: 17.2, fiber_per_100g: 4.9, gi_index: 38 },
  { name: "Yam", name_zh: "山药", category: FoodCategory.OTHER, calories_per_100g: 57, protein_per_100g: 1.5, fat_per_100g: 0.1, carbs_per_100g: 13.1, fiber_per_100g: 1.6, gi_index: 51 },
  { name: "Black Beans", name_zh: "黑豆", category: FoodCategory.OTHER, calories_per_100g: 341, protein_per_100g: 21.6, fat_per_100g: 1.4, carbs_per_100g: 62.4, fiber_per_100g: 15.5, gi_index: 30 },
  { name: "Chickpeas", name_zh: "鹰嘴豆", category: FoodCategory.OTHER, calories_per_100g: 364, protein_per_100g: 19.3, fat_per_100g: 6.0, carbs_per_100g: 60.7, fiber_per_100g: 17.4, gi_index: 28 },
  { name: "Seaweed", name_zh: "海带", category: FoodCategory.OTHER, calories_per_100g: 43, protein_per_100g: 1.7, fat_per_100g: 0.6, carbs_per_100g: 9.6, fiber_per_100g: 1.3, gi_index: 15 },
  { name: "Wood Ear Mushroom", name_zh: "木耳", category: FoodCategory.OTHER, calories_per_100g: 25, protein_per_100g: 1.5, fat_per_100g: 0.2, carbs_per_100g: 6.7, fiber_per_100g: 5.0, gi_index: 15 }
] as const;

async function main() {
  await prisma.foodItem.deleteMany({
    where: {
      name_zh: "泡菜",
      is_custom: false
    }
  });

  for (const item of foodItems) {
    await prisma.foodItem.upsert({
      where: {
        name_name_zh: {
          name: item.name,
          name_zh: item.name_zh
        }
      },
      update: item,
      create: item
    });
  }

  console.log(`Seeded ${foodItems.length} food items.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
