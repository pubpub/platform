-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "parent_id" TEXT;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "pubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
