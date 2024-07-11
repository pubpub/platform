/*
  Warnings:

  - A unique constraint covering the columns `[name,communityId]` on the table `forms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug,communityId]` on the table `forms` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `communityId` to the `forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `forms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "communityId" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "forms_name_communityId_key" ON "forms"("name", "communityId");

-- CreateIndex
CREATE UNIQUE INDEX "forms_slug_communityId_key" ON "forms"("slug", "communityId");

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
