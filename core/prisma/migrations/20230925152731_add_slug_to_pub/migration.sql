/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `pubs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pubs_slug_key" ON "pubs"("slug");
