import { FoodCategory, type FoodItemSummary } from "@/lib/domain";

export const loginVisualImage =
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1400&q=80";

export const onboardingVisualImage =
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=80";

export interface FoodVisualMeta {
  symbol: string;
  toneClassName: string;
}

const curatedImageRules: Array<{
  keywords: string[];
  excludeKeywords?: string[];
  imageUrl: string;
}> = [
  {
    keywords: ["无糖豆浆", "豆浆", "soy milk"],
    imageUrl:
      "https://images.unsplash.com/photo-1555465083-a845797ef750?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["绿茶", "green tea"],
    imageUrl:
      "https://images.unsplash.com/photo-1641997827830-12fa1d1a238d?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["黑咖啡", "coffee"],
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["馒头", "steamed bun"],
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["鸡胸肉", "chicken breast"],
    imageUrl:
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["牛肉", "lean beef", "beef"],
    imageUrl:
      "https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["里脊肉", "pork tenderloin", "鸭胸肉", "duck breast"],
    imageUrl:
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["三文鱼", "salmon"],
    imageUrl:
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["鳕鱼", "cod", "金枪鱼", "tuna"],
    imageUrl:
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["虾", "shrimp"],
    imageUrl:
      "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["豆腐", "tofu"],
    imageUrl:
      "https://images.unsplash.com/photo-1544519685-86ccb2dab444?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["牛油果", "avocado"],
    imageUrl:
      "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["苹果", "apple"],
    imageUrl:
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["香蕉", "banana"],
    imageUrl:
      "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["蓝莓", "blueberry"],
    imageUrl:
      "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["草莓", "strawberry"],
    imageUrl:
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["橙子", "orange"],
    imageUrl:
      "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["猕猴桃", "kiwi"],
    imageUrl:
      "https://images.unsplash.com/photo-1585059895524-72359e06133a?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["西柚", "grapefruit"],
    imageUrl:
      "https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["梨", "pear"],
    imageUrl:
      "https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["鸡蛋", "egg"],
    imageUrl:
      "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["菠菜", "spinach"],
    imageUrl:
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["番茄", "tomato"],
    imageUrl:
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["黄瓜", "cucumber"],
    imageUrl:
      "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["生菜", "lettuce", "小白菜", "bok choy", "大白菜", "chinese cabbage"],
    imageUrl:
      "https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["胡萝卜", "carrot"],
    imageUrl:
      "https://images.unsplash.com/photo-1445282768818-728615cc910a?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["彩椒", "bell pepper"],
    imageUrl:
      "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["木耳", "wood ear mushroom"],
    imageUrl:
      "https://images.unsplash.com/photo-1504545102780-26774c1bb073?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["蘑菇"],
    imageUrl:
      "https://images.unsplash.com/photo-1504545102780-26774c1bb073?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["西兰花", "broccoli"],
    imageUrl:
      "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["玉米", "corn"],
    imageUrl:
      "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["红薯", "sweet potato"],
    imageUrl:
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["山药", "yam"],
    imageUrl:
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["莲藕", "lotus root"],
    imageUrl:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["南瓜", "pumpkin"],
    imageUrl:
      "https://images.unsplash.com/photo-1506917728037-b6af01a7d403?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["糙米饭", "brown rice"],
    imageUrl:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["米饭", "white rice"],
    excludeKeywords: ["糙米饭", "brown rice"],
    imageUrl:
      "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["米粉", "rice noodles", "全麦面", "whole wheat noodles"],
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["牛奶"],
    imageUrl:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["乳清蛋白粉", "whey protein"],
    imageUrl:
      "https://images.unsplash.com/photo-1774793476396-de61c6d0fa20?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["酸奶", "greek yogurt", "yogurt"],
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["茅屋奶酪", "cottage cheese"],
    imageUrl:
      "https://images.unsplash.com/photo-1753173301157-8136a70b4178?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["奶酪", "cheese"],
    imageUrl:
      "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["燕麦", "oats"],
    imageUrl:
      "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["全麦面包", "bread"],
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["杏仁", "almond"],
    imageUrl:
      "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["核桃", "walnut", "腰果", "cashew"],
    imageUrl:
      "https://images.unsplash.com/photo-1615485925600-97237c4fc1ec?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["毛豆", "edamame"],
    imageUrl:
      "https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["黑豆", "black beans", "鹰嘴豆", "chickpeas"],
    imageUrl:
      "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=800&q=80"
  },
  {
    keywords: ["海带", "seaweed"],
    imageUrl:
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80"
  }
];

const categoryVisualMap: Record<FoodCategory, FoodVisualMeta> = {
  [FoodCategory.STAPLE]: {
    symbol: "米",
    toneClassName: "from-amber-50 via-orange-100 to-lime-100 text-amber-800"
  },
  [FoodCategory.MEAT]: {
    symbol: "肉",
    toneClassName: "from-rose-50 via-red-100 to-orange-100 text-red-800"
  },
  [FoodCategory.VEGETABLE]: {
    symbol: "菜",
    toneClassName: "from-emerald-50 via-green-100 to-lime-100 text-emerald-800"
  },
  [FoodCategory.FRUIT]: {
    symbol: "果",
    toneClassName: "from-orange-50 via-rose-100 to-yellow-100 text-orange-800"
  },
  [FoodCategory.DAIRY]: {
    symbol: "奶",
    toneClassName: "from-sky-50 via-blue-100 to-stone-100 text-sky-800"
  },
  [FoodCategory.SNACK]: {
    symbol: "坚",
    toneClassName: "from-yellow-50 via-amber-100 to-orange-100 text-amber-800"
  },
  [FoodCategory.BEVERAGE]: {
    symbol: "饮",
    toneClassName: "from-cyan-50 via-emerald-100 to-teal-100 text-teal-800"
  },
  [FoodCategory.OTHER]: {
    symbol: "食",
    toneClassName: "from-slate-50 via-stone-100 to-zinc-100 text-slate-700"
  }
};

const namedVisualRules: Array<{
  keywords: string[];
  meta: FoodVisualMeta;
}> = [
  { keywords: ["无糖豆浆", "豆浆", "soy milk"], meta: { symbol: "豆", toneClassName: "from-emerald-50 via-stone-100 to-lime-100 text-emerald-800" } },
  { keywords: ["黑咖啡", "coffee"], meta: { symbol: "咖", toneClassName: "from-stone-200 via-zinc-300 to-neutral-500 text-stone-950" } },
  { keywords: ["绿茶", "green tea", "tea"], meta: { symbol: "茶", toneClassName: "from-lime-50 via-green-100 to-emerald-200 text-green-800" } },
  { keywords: ["牛奶", "milk"], meta: { symbol: "奶", toneClassName: "from-sky-50 via-white to-blue-100 text-sky-800" } },
  { keywords: ["酸奶", "greek yogurt", "yogurt"], meta: { symbol: "酸", toneClassName: "from-blue-50 via-white to-stone-100 text-blue-800" } },
  { keywords: ["乳清蛋白粉", "whey protein"], meta: { symbol: "乳", toneClassName: "from-indigo-50 via-sky-100 to-stone-100 text-indigo-800" } },
  { keywords: ["奶酪", "cheese"], meta: { symbol: "酪", toneClassName: "from-yellow-50 via-amber-100 to-orange-100 text-amber-800" } },
  { keywords: ["米饭", "糙米饭", "white rice", "brown rice", "rice"], meta: { symbol: "米", toneClassName: "from-stone-50 via-amber-100 to-lime-100 text-amber-800" } },
  { keywords: ["馒头", "steamed bun"], meta: { symbol: "馒", toneClassName: "from-stone-50 via-orange-100 to-yellow-100 text-orange-800" } },
  { keywords: ["燕麦", "oats"], meta: { symbol: "燕", toneClassName: "from-yellow-50 via-amber-100 to-stone-200 text-amber-900" } },
  { keywords: ["全麦面包", "bread"], meta: { symbol: "麦", toneClassName: "from-amber-50 via-orange-100 to-stone-200 text-orange-900" } },
  { keywords: ["全麦面", "米粉", "noodles"], meta: { symbol: "面", toneClassName: "from-yellow-50 via-orange-100 to-amber-100 text-orange-800" } },
  { keywords: ["红薯", "sweet potato", "山药", "yam"], meta: { symbol: "薯", toneClassName: "from-orange-50 via-amber-100 to-purple-100 text-orange-800" } },
  { keywords: ["玉米", "corn"], meta: { symbol: "玉", toneClassName: "from-yellow-50 via-yellow-200 to-lime-100 text-yellow-900" } },
  { keywords: ["南瓜", "pumpkin"], meta: { symbol: "南", toneClassName: "from-orange-50 via-orange-200 to-amber-100 text-orange-900" } },
  { keywords: ["鸡胸肉", "chicken"], meta: { symbol: "鸡", toneClassName: "from-rose-50 via-orange-100 to-stone-100 text-orange-900" } },
  { keywords: ["牛肉", "beef"], meta: { symbol: "牛", toneClassName: "from-red-50 via-rose-200 to-orange-100 text-red-900" } },
  { keywords: ["三文鱼", "salmon"], meta: { symbol: "鱼", toneClassName: "from-orange-50 via-rose-200 to-sky-100 text-rose-800" } },
  { keywords: ["虾", "shrimp"], meta: { symbol: "虾", toneClassName: "from-pink-50 via-orange-100 to-rose-100 text-pink-800" } },
  { keywords: ["鸡蛋", "egg"], meta: { symbol: "蛋", toneClassName: "from-yellow-50 via-amber-100 to-white text-yellow-900" } },
  { keywords: ["里脊肉", "pork", "鸭胸肉", "duck"], meta: { symbol: "肉", toneClassName: "from-red-50 via-rose-100 to-stone-100 text-red-800" } },
  { keywords: ["鳕鱼", "cod", "金枪鱼", "tuna"], meta: { symbol: "鱼", toneClassName: "from-sky-50 via-blue-100 to-stone-100 text-sky-800" } },
  { keywords: ["西兰花", "broccoli"], meta: { symbol: "兰", toneClassName: "from-green-50 via-emerald-200 to-lime-100 text-emerald-900" } },
  { keywords: ["菠菜", "spinach", "生菜", "lettuce", "白菜", "cabbage", "bok choy"], meta: { symbol: "叶", toneClassName: "from-lime-50 via-green-100 to-emerald-200 text-green-800" } },
  { keywords: ["番茄", "tomato"], meta: { symbol: "茄", toneClassName: "from-red-50 via-rose-200 to-orange-100 text-red-800" } },
  { keywords: ["黄瓜", "cucumber"], meta: { symbol: "瓜", toneClassName: "from-lime-50 via-emerald-100 to-green-200 text-green-800" } },
  { keywords: ["胡萝卜", "carrot"], meta: { symbol: "胡", toneClassName: "from-orange-50 via-orange-200 to-yellow-100 text-orange-900" } },
  { keywords: ["彩椒", "bell pepper"], meta: { symbol: "椒", toneClassName: "from-red-50 via-yellow-100 to-green-100 text-red-800" } },
  { keywords: ["蘑菇", "mushroom", "木耳"], meta: { symbol: "菇", toneClassName: "from-stone-100 via-zinc-200 to-neutral-100 text-stone-800" } },
  { keywords: ["苹果", "apple"], meta: { symbol: "苹", toneClassName: "from-red-50 via-rose-100 to-lime-100 text-red-800" } },
  { keywords: ["香蕉", "banana"], meta: { symbol: "蕉", toneClassName: "from-yellow-50 via-yellow-200 to-amber-100 text-yellow-900" } },
  { keywords: ["蓝莓", "blueberry"], meta: { symbol: "莓", toneClassName: "from-blue-50 via-indigo-200 to-purple-100 text-indigo-900" } },
  { keywords: ["牛油果", "avocado"], meta: { symbol: "油果", toneClassName: "from-lime-50 via-green-200 to-yellow-100 text-green-900" } },
  { keywords: ["橙子", "orange"], meta: { symbol: "橙", toneClassName: "from-orange-50 via-orange-200 to-yellow-100 text-orange-900" } },
  { keywords: ["西柚", "grapefruit"], meta: { symbol: "柚", toneClassName: "from-pink-50 via-rose-100 to-orange-100 text-pink-800" } },
  { keywords: ["草莓", "strawberry"], meta: { symbol: "莓", toneClassName: "from-rose-50 via-red-200 to-pink-100 text-red-800" } },
  { keywords: ["猕猴桃", "kiwi"], meta: { symbol: "猕", toneClassName: "from-lime-50 via-green-200 to-stone-100 text-green-900" } },
  { keywords: ["梨", "pear"], meta: { symbol: "梨", toneClassName: "from-yellow-50 via-lime-100 to-green-100 text-lime-800" } },
  { keywords: ["杏仁", "almond", "核桃", "walnut", "腰果", "cashew"], meta: { symbol: "坚", toneClassName: "from-amber-50 via-yellow-100 to-orange-200 text-amber-900" } },
  { keywords: ["毛豆", "edamame"], meta: { symbol: "毛", toneClassName: "from-lime-50 via-green-200 to-emerald-100 text-green-900" } },
  { keywords: ["豆腐", "tofu"], meta: { symbol: "腐", toneClassName: "from-stone-50 via-white to-amber-100 text-stone-800" } },
  { keywords: ["莲藕", "lotus root"], meta: { symbol: "藕", toneClassName: "from-stone-50 via-rose-100 to-amber-100 text-stone-800" } },
  { keywords: ["黑豆", "black beans", "鹰嘴豆", "chickpeas"], meta: { symbol: "豆", toneClassName: "from-slate-100 via-amber-100 to-stone-300 text-slate-900" } },
  { keywords: ["海带", "seaweed"], meta: { symbol: "海", toneClassName: "from-teal-50 via-emerald-100 to-cyan-100 text-teal-900" } }
];

function normalizeFoodLabel(food: Pick<FoodItemSummary, "name" | "nameZh">) {
  return `${food.nameZh ?? ""} ${food.name ?? ""}`.trim().toLowerCase();
}

export function getCuratedFoodImageUrl(food: Pick<FoodItemSummary, "name" | "nameZh">) {
  const label = normalizeFoodLabel(food);

  for (const rule of curatedImageRules) {
    const matchesKeyword = rule.keywords.some((keyword) => label.includes(keyword.toLowerCase()));
    const isExcluded = rule.excludeKeywords?.some((keyword) => label.includes(keyword.toLowerCase())) ?? false;

    if (matchesKeyword && !isExcluded) {
      return rule.imageUrl;
    }
  }

  return null;
}

export function getFoodVisualMeta(food: Pick<FoodItemSummary, "name" | "nameZh" | "category">) {
  const label = normalizeFoodLabel(food);

  for (const rule of namedVisualRules) {
    if (rule.keywords.some((keyword) => label.includes(keyword.toLowerCase()))) {
      return rule.meta;
    }
  }

  return categoryVisualMap[food.category] || categoryVisualMap[FoodCategory.OTHER];
}

export function getExactFoodImageUrl(food: Pick<FoodItemSummary, "name" | "nameZh" | "imageUrl">) {
  return food.imageUrl?.trim() || getCuratedFoodImageUrl(food);
}

export function getFoodImageUrlCandidates(food: Pick<FoodItemSummary, "name" | "nameZh" | "imageUrl">) {
  return Array.from(
    new Set(
      [food.imageUrl?.trim() || null, getCuratedFoodImageUrl(food)].filter((url): url is string => Boolean(url))
    )
  );
}
