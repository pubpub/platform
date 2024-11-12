/*
  Warnings:

  - You are about to drop the `_PermissionToPub` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PermissionToStage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `form_to_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PermissionToPub" DROP CONSTRAINT "_PermissionToPub_A_fkey";

-- DropForeignKey
ALTER TABLE "_PermissionToPub" DROP CONSTRAINT "_PermissionToPub_B_fkey";

-- DropForeignKey
ALTER TABLE "_PermissionToStage" DROP CONSTRAINT "_PermissionToStage_A_fkey";

-- DropForeignKey
ALTER TABLE "_PermissionToStage" DROP CONSTRAINT "_PermissionToStage_B_fkey";

-- DropForeignKey
ALTER TABLE "form_to_permissions" DROP CONSTRAINT "form_to_permissions_formId_fkey";

-- DropForeignKey
ALTER TABLE "form_to_permissions" DROP CONSTRAINT "form_to_permissions_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_communityId_fkey";

-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_userId_fkey";

-- DropForeignKey
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_memberGroupId_fkey";

-- DropForeignKey
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_memberId_fkey";

-- DropTable
DROP TABLE "_PermissionToPub";

-- DropTable
DROP TABLE "_PermissionToStage";

-- DropTable
DROP TABLE "form_to_permissions";

-- DropTable
DROP TABLE "members";

-- DropTable
DROP TABLE "permissions";
