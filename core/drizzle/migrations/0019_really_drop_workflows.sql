/*
  Warnings:

  - You are about to drop the column `workflow_id` on the `stages` table. All the data in the column will be lost.
  - You are about to drop the `_PermissionToWorkflow` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workflows` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `community_id` to the `stages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_PermissionToWorkflow" DROP CONSTRAINT "_PermissionToWorkflow_A_fkey";

-- DropForeignKey
ALTER TABLE "_PermissionToWorkflow" DROP CONSTRAINT "_PermissionToWorkflow_B_fkey";

-- DropForeignKey
ALTER TABLE "pins" DROP CONSTRAINT "pins_instance_id_fkey";

-- DropForeignKey
ALTER TABLE "pins" DROP CONSTRAINT "pins_pub_id_fkey";

-- DropForeignKey
ALTER TABLE "pins" DROP CONSTRAINT "pins_user_id_fkey";

-- DropForeignKey
ALTER TABLE "pins" DROP CONSTRAINT "pins_workflow_id_fkey";

-- DropForeignKey
ALTER TABLE "stages" DROP CONSTRAINT "stages_workflow_id_fkey";

-- DropForeignKey
ALTER TABLE "workflows" DROP CONSTRAINT "workflows_community_id_fkey";

-- AlterTable
ALTER TABLE "stages" DROP COLUMN "workflow_id",
ADD COLUMN     "community_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "_PermissionToWorkflow";

-- DropTable
DROP TABLE "pins";

-- DropTable
DROP TABLE "workflows";

-- CreateTable
CREATE TABLE "_MemberGroupToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_MemberGroupToUser_AB_unique" ON "_MemberGroupToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_MemberGroupToUser_B_index" ON "_MemberGroupToUser"("B");

-- AddForeignKey
ALTER TABLE "stages" ADD CONSTRAINT "stages_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberGroupToUser" ADD CONSTRAINT "_MemberGroupToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberGroupToUser" ADD CONSTRAINT "_MemberGroupToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
