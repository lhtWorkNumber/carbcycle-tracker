-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_FoodItem" (
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
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER,
    CONSTRAINT "FoodItem_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_FoodItem" (
    "id",
    "name",
    "name_zh",
    "category",
    "calories_per_100g",
    "protein_per_100g",
    "fat_per_100g",
    "carbs_per_100g",
    "fiber_per_100g",
    "gi_index",
    "image_url",
    "is_custom"
)
SELECT
    "id",
    "name",
    "name_zh",
    "category",
    "calories_per_100g",
    "protein_per_100g",
    "fat_per_100g",
    "carbs_per_100g",
    "fiber_per_100g",
    "gi_index",
    "image_url",
    "is_custom"
FROM "FoodItem";

DROP TABLE "FoodItem";
ALTER TABLE "new_FoodItem" RENAME TO "FoodItem";

CREATE UNIQUE INDEX "FoodItem_name_name_zh_key" ON "FoodItem"("name", "name_zh");
CREATE INDEX "FoodItem_user_id_is_custom_idx" ON "FoodItem"("user_id", "is_custom");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- AlterTable
ALTER TABLE "BodyRecord" ADD COLUMN "before_photo_url" TEXT;
ALTER TABLE "BodyRecord" ADD COLUMN "after_photo_url" TEXT;
