-- DropForeignKey
ALTER TABLE "PubsInStages" DROP CONSTRAINT "PubsInStages_pubId_fkey";

-- DropForeignKey
ALTER TABLE "PubsInStages" DROP CONSTRAINT "PubsInStages_stageId_fkey";

-- AddForeignKey
ALTER TABLE "PubsInStages" ADD CONSTRAINT "PubsInStages_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PubsInStages" ADD CONSTRAINT "PubsInStages_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
