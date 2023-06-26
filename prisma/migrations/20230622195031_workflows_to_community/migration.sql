/*
  Warnings:

  - Added the required column `community_id` to the `workflows` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "workflows" ADD COLUMN     "community_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
