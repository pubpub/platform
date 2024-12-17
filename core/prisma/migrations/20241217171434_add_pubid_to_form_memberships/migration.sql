/*
  Warnings:

  - A unique constraint covering the columns `[formId,userId,pubId]` on the table `form_memberships` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[formId,memberGroupId,pubId]` on the table `form_memberships` will be added. If there are existing duplicate values, this will fail.

*/

-- AlterTable
ALTER TABLE "form_memberships" ADD COLUMN     "pubId" TEXT;

-- AddForeignKey
ALTER TABLE "form_memberships" ADD CONSTRAINT "form_memberships_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex
DROP INDEX "form_memberships_formId_memberGroupId_key";

-- DropIndex
DROP INDEX "form_memberships_formId_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "form_memberships_formId_userId_pubId_key" ON "form_memberships"("formId", "userId", "pubId");

-- CreateIndex
CREATE UNIQUE INDEX "form_memberships_formId_memberGroupId_pubId_key" ON "form_memberships"("formId", "memberGroupId", "pubId");

