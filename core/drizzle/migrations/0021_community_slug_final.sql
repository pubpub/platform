/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `communities` will be added. If there are existing duplicate values, this will fail.
  - Made the column `slug` on table `communities` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "communities" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "communities_slug_key" ON "communities"("slug");
