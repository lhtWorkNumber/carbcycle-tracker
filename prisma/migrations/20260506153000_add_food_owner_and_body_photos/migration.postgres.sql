ALTER TABLE "FoodItem" ADD COLUMN "user_id" INTEGER;

ALTER TABLE "FoodItem"
  ADD CONSTRAINT "FoodItem_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "FoodItem_user_id_is_custom_idx" ON "FoodItem"("user_id", "is_custom");

ALTER TABLE "BodyRecord" ADD COLUMN "before_photo_url" TEXT;
ALTER TABLE "BodyRecord" ADD COLUMN "after_photo_url" TEXT;
