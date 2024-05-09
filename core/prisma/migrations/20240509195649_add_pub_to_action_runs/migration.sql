/*
  Warnings:

  - Added the required column `pub_id` to the `action_runs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "action_runs" ADD COLUMN     "pub_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
