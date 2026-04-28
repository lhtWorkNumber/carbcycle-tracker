-- CreateTable
CREATE TABLE "MealTemplate" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "user_id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "meal_type" TEXT NOT NULL,
  "day_types_json" TEXT,
  "built_in" BOOLEAN NOT NULL DEFAULT false,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "MealTemplate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealTemplateItem" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "meal_template_id" INTEGER NOT NULL,
  "food_item_id" INTEGER,
  "name" TEXT NOT NULL,
  "name_zh" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "quantity_grams" REAL NOT NULL,
  "calories" REAL NOT NULL,
  "protein" REAL NOT NULL,
  "fat" REAL NOT NULL,
  "carbs" REAL NOT NULL,
  "fiber" REAL NOT NULL,
  CONSTRAINT "MealTemplateItem_meal_template_id_fkey" FOREIGN KEY ("meal_template_id") REFERENCES "MealTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MealTemplateItem_food_item_id_fkey" FOREIGN KEY ("food_item_id") REFERENCES "FoodItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WaterLog" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "user_id" INTEGER NOT NULL,
  "date" DATETIME NOT NULL,
  "target_ml" INTEGER NOT NULL,
  "amount_ml" INTEGER NOT NULL,
  "entries_json" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "WaterLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeeklySummary" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "user_id" INTEGER NOT NULL,
  "week_key" TEXT NOT NULL,
  "week_label" TEXT NOT NULL,
  "adherence_rate" REAL NOT NULL,
  "weight_change" REAL NOT NULL,
  "calorie_average" REAL NOT NULL,
  "protein_average" REAL NOT NULL,
  "fat_average" REAL NOT NULL,
  "carbs_average" REAL NOT NULL,
  "comparison_json" TEXT,
  "motivational_message" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "WeeklySummary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AchievementProgress" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "user_id" INTEGER NOT NULL,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "unlocked" BOOLEAN NOT NULL DEFAULT false,
  "unlocked_at" DATETIME,
  "progress" REAL NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "AchievementProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MealTemplate_user_id_meal_type_idx" ON "MealTemplate"("user_id", "meal_type");

-- CreateIndex
CREATE INDEX "MealTemplateItem_meal_template_id_idx" ON "MealTemplateItem"("meal_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "WaterLog_user_id_date_key" ON "WaterLog"("user_id", "date");

-- CreateIndex
CREATE INDEX "WaterLog_user_id_date_idx" ON "WaterLog"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklySummary_user_id_week_key_key" ON "WeeklySummary"("user_id", "week_key");

-- CreateIndex
CREATE INDEX "WeeklySummary_user_id_week_key_idx" ON "WeeklySummary"("user_id", "week_key");

-- CreateIndex
CREATE UNIQUE INDEX "AchievementProgress_user_id_key_key" ON "AchievementProgress"("user_id", "key");

-- CreateIndex
CREATE INDEX "AchievementProgress_user_id_key_idx" ON "AchievementProgress"("user_id", "key");
