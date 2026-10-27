-- AlterTable
ALTER TABLE "HomepageImage" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'intro';

-- DropIndex
DROP INDEX "HomepageImage_homepageId_key";

-- CreateIndex
CREATE UNIQUE INDEX "HomepageImage_homepageId_role_key" ON "HomepageImage"("homepageId", "role");
