/*
  Warnings:

  - You are about to drop the column `homepageImageId` on the `HomePage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HomePage" DROP COLUMN "homepageImageId",
ALTER COLUMN "title" DROP DEFAULT;
