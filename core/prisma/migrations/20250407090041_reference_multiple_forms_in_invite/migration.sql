/*
  Warnings:

  - You are about to drop the column `communityLevelFormId` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `pubOrStageFormId` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `pubOrStageRole` on the `invites` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "InviteFormType" AS ENUM ('communityLevel', 'pubOrStage');

-- DropForeignKey
ALTER TABLE "invites" DROP CONSTRAINT "invites_communityLevelFormId_fkey";

-- DropForeignKey
ALTER TABLE "invites" DROP CONSTRAINT "invites_pubOrStageFormId_fkey";

-- AlterTable
ALTER TABLE "invites" DROP COLUMN "communityLevelFormId",
DROP COLUMN "pubOrStageFormId",
DROP COLUMN "pubOrStageRole";

-- CreateTable
CREATE TABLE "invite_forms" (
    "inviteId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "type" "InviteFormType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_forms_pkey" PRIMARY KEY ("inviteId","formId","type")
);

-- CreateIndex
CREATE UNIQUE INDEX "invite_forms_inviteId_formId_type_key" ON "invite_forms"("inviteId", "formId", "type");

-- AddForeignKey
ALTER TABLE "invite_forms" ADD CONSTRAINT "invite_forms_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_forms" ADD CONSTRAINT "invite_forms_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add check constraint
-- function because you cannot use subqueries in check constraints
CREATE OR REPLACE FUNCTION check_invite_has_pub_or_stage(type "InviteFormType", invite_id TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN "type" != 'pubOrStage' OR 
    EXISTS (
    SELECT 1 FROM "invites" 
    WHERE "invites"."id" = invite_id 
    AND ("invites"."pubId" IS NOT NULL OR "invites"."stageId" IS NOT NULL)
  );
END;
$$ LANGUAGE plpgsql;

-- Add check constraint using the function
ALTER TABLE "invite_forms" ADD CONSTRAINT "invite_forms_check_pubOrStage_form_exists" 
CHECK (check_invite_has_pub_or_stage("type", "inviteId"));