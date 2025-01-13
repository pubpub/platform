/*
  Warnings:

  - A unique constraint covering the columns `[name,communityId]` on the table `pub_types` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "pub_types_name_communityId_key" ON "pub_types"("name", "communityId");
