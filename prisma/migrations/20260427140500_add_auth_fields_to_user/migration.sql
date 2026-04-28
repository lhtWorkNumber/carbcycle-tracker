-- AlterTable
ALTER TABLE "User" ADD COLUMN "auth_user_id" TEXT;
ALTER TABLE "User" ADD COLUMN "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_auth_user_id_key" ON "User"("auth_user_id");
