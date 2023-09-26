/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `pubs` will be added. If there are existing duplicate values, this will fail.
  - The required column `slug` was added to the `pubs` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pubs_slug_key" ON "pubs"("slug");
