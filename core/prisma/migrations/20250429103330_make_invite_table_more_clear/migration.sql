/*
  Warnings:

  - You are about to drop the column `pubOrStageRole` on the `invites` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invites" DROP COLUMN "pubOrStageRole",
ADD COLUMN     "pubRole" "MemberRole",
ADD COLUMN     "stageRole" "MemberRole";
