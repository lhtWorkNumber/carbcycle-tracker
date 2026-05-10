-- CreateTable
CREATE TABLE "UserIdentity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "union_id" TEXT,
    "app_id" TEXT,
    "verified_at" DATETIME,
    "raw_profile_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "UserIdentity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserIdentity_provider_provider_user_id_key" ON "UserIdentity"("provider", "provider_user_id");

-- CreateIndex
CREATE INDEX "UserIdentity_user_id_provider_idx" ON "UserIdentity"("user_id", "provider");

-- CreateIndex
CREATE INDEX "UserIdentity_provider_union_id_idx" ON "UserIdentity"("provider", "union_id");
