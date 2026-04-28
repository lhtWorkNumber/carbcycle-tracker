-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "height" REAL NOT NULL,
    "weight" REAL NOT NULL,
    "body_fat_percentage" REAL,
    "activity_level" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FoodItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "name_zh" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "calories_per_100g" REAL NOT NULL,
    "protein_per_100g" REAL NOT NULL,
    "fat_per_100g" REAL NOT NULL,
    "carbs_per_100g" REAL NOT NULL,
    "fiber_per_100g" REAL NOT NULL,
    "gi_index" REAL,
    "image_url" TEXT,
    "is_custom" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "MealLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "food_item_id" INTEGER NOT NULL,
    "meal_type" TEXT NOT NULL,
    "quantity_grams" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealLog_food_item_id_fkey" FOREIGN KEY ("food_item_id") REFERENCES "FoodItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "day_type" TEXT NOT NULL,
    "target_calories" REAL NOT NULL,
    "target_protein_g" REAL NOT NULL,
    "target_fat_g" REAL NOT NULL,
    "target_carbs_g" REAL NOT NULL,
    "actual_calories" REAL NOT NULL DEFAULT 0,
    "actual_protein_g" REAL NOT NULL DEFAULT 0,
    "actual_fat_g" REAL NOT NULL DEFAULT 0,
    "actual_carbs_g" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "DailyPlan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BodyRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "weight" REAL NOT NULL,
    "body_fat_percentage" REAL,
    "waist_cm" REAL,
    "note" TEXT,
    CONSTRAINT "BodyRecord_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExerciseLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "exercise_name" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "calories_burned" REAL NOT NULL,
    "exercise_type" TEXT NOT NULL,
    CONSTRAINT "ExerciseLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodItem_name_name_zh_key" ON "FoodItem"("name", "name_zh");

-- CreateIndex
CREATE INDEX "MealLog_user_id_date_idx" ON "MealLog"("user_id", "date");

-- CreateIndex
CREATE INDEX "MealLog_food_item_id_date_idx" ON "MealLog"("food_item_id", "date");

-- CreateIndex
CREATE INDEX "DailyPlan_date_idx" ON "DailyPlan"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlan_user_id_date_key" ON "DailyPlan"("user_id", "date");

-- CreateIndex
CREATE INDEX "BodyRecord_user_id_date_idx" ON "BodyRecord"("user_id", "date");

-- CreateIndex
CREATE INDEX "ExerciseLog_user_id_date_idx" ON "ExerciseLog"("user_id", "date");
