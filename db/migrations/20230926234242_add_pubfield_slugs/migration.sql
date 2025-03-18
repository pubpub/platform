/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `pub_fields` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `pub_fields` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pub_fields" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pub_fields_slug_key" ON "pub_fields"("slug");
