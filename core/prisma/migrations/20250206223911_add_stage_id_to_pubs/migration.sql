-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "stageId" TEXT;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;