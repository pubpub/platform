/*
  Warnings:

  - You are about to drop the `action_claim` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `action_move` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "action_claim" DROP CONSTRAINT "action_claim_pubId_fkey";

-- DropForeignKey
ALTER TABLE "action_claim" DROP CONSTRAINT "action_claim_stageId_fkey";

-- DropForeignKey
ALTER TABLE "action_claim" DROP CONSTRAINT "action_claim_userId_fkey";

-- DropForeignKey
ALTER TABLE "action_move" DROP CONSTRAINT "action_move_destinationStageId_fkey";

-- DropForeignKey
ALTER TABLE "action_move" DROP CONSTRAINT "action_move_pubId_fkey";

-- DropForeignKey
ALTER TABLE "action_move" DROP CONSTRAINT "action_move_sourceStageId_fkey";

-- DropForeignKey
ALTER TABLE "action_move" DROP CONSTRAINT "action_move_userId_fkey";

-- DropForeignKey
ALTER TABLE "form_elements" DROP CONSTRAINT "form_elements_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "form_elements" DROP CONSTRAINT "form_elements_formId_fkey";

-- DropForeignKey
ALTER TABLE "forms" DROP CONSTRAINT "forms_communityId_fkey";

-- DropForeignKey
ALTER TABLE "member_groups" DROP CONSTRAINT "member_groups_communityId_fkey";

-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_userId_fkey";

-- DropForeignKey
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_memberGroupId_fkey";

-- DropForeignKey
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_memberId_fkey";

-- DropTable
DROP TABLE "action_claim";

-- DropTable
DROP TABLE "action_move";

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_groups" ADD CONSTRAINT "member_groups_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_memberGroupId_fkey" FOREIGN KEY ("memberGroupId") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_elements" ADD CONSTRAINT "form_elements_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "pub_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_elements" ADD CONSTRAINT "form_elements_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
