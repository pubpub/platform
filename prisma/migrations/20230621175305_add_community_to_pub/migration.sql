/*
  Warnings:

  - Added the required column `community_id` to the `pubs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "community_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
