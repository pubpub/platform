-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "assignee_id" TEXT;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
