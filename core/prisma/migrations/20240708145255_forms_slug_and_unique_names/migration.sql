/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `forms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `forms` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `forms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "forms_name_key" ON "forms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "forms_slug_key" ON "forms"("slug");
