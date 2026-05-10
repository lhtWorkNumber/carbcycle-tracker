CREATE TYPE "UserIdentityProvider" AS ENUM ('SUPABASE', 'WECHAT_MINIAPP', 'PHONE');

CREATE TABLE "UserIdentity" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider" "UserIdentityProvider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "union_id" TEXT,
    "app_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "raw_profile_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIdentity_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "UserIdentity"
  ADD CONSTRAINT "UserIdentity_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "UserIdentity_provider_provider_user_id_key" ON "UserIdentity"("provider", "provider_user_id");
CREATE INDEX "UserIdentity_user_id_provider_idx" ON "UserIdentity"("user_id", "provider");
CREATE INDEX "UserIdentity_provider_union_id_idx" ON "UserIdentity"("provider", "union_id");
