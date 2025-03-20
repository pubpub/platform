/*
  Warnings:

  - A unique constraint covering the columns `[userId,communityId]` on the table `members` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "members_userId_communityId_key" ON "members"("userId", "communityId");
