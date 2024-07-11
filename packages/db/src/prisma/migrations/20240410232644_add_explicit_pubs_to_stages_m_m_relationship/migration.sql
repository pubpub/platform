-- CreateTable
CREATE TABLE "PubsInStages" (
    "pubId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,

    CONSTRAINT "PubsInStages_pkey" PRIMARY KEY ("pubId","stageId")
);

-- AddForeignKey
ALTER TABLE "PubsInStages" ADD CONSTRAINT "PubsInStages_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PubsInStages" ADD CONSTRAINT "PubsInStages_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
