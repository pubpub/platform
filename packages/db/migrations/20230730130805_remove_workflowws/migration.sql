/*
  Warnings:

  - Added the required column `canAdmin` to the `member_groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `community_id` to the `member_groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `canAdmin` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `community_id` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `members` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "member_groups" ADD COLUMN     "canAdmin" BOOLEAN NOT NULL,
ADD COLUMN     "community_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "canAdmin" BOOLEAN NOT NULL,
ADD COLUMN     "community_id" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "member_id" TEXT,
    "member_group_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PermissionToPub" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PermissionToStage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PermissionToWorkflow" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToPub_AB_unique" ON "_PermissionToPub"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToPub_B_index" ON "_PermissionToPub"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToStage_AB_unique" ON "_PermissionToStage"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToStage_B_index" ON "_PermissionToStage"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToWorkflow_AB_unique" ON "_PermissionToWorkflow"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToWorkflow_B_index" ON "_PermissionToWorkflow"("B");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_groups" ADD CONSTRAINT "member_groups_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_member_group_id_fkey" FOREIGN KEY ("member_group_id") REFERENCES "member_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToPub" ADD CONSTRAINT "_PermissionToPub_A_fkey" FOREIGN KEY ("A") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToPub" ADD CONSTRAINT "_PermissionToPub_B_fkey" FOREIGN KEY ("B") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToStage" ADD CONSTRAINT "_PermissionToStage_A_fkey" FOREIGN KEY ("A") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToStage" ADD CONSTRAINT "_PermissionToStage_B_fkey" FOREIGN KEY ("B") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToWorkflow" ADD CONSTRAINT "_PermissionToWorkflow_A_fkey" FOREIGN KEY ("A") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToWorkflow" ADD CONSTRAINT "_PermissionToWorkflow_B_fkey" FOREIGN KEY ("B") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
