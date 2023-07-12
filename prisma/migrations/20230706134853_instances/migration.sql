/*
  Warnings:

  - Added the required column `actions` to the `integrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `integrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `settingsUrl` to the `integrations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "integrations" ADD COLUMN     "actions" JSONB NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "settingsUrl" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "integration_instances" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_IntegrationInstanceToPub" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_IntegrationInstanceToStage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_IntegrationInstanceToPub_AB_unique" ON "_IntegrationInstanceToPub"("A", "B");

-- CreateIndex
CREATE INDEX "_IntegrationInstanceToPub_B_index" ON "_IntegrationInstanceToPub"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_IntegrationInstanceToStage_AB_unique" ON "_IntegrationInstanceToStage"("A", "B");

-- CreateIndex
CREATE INDEX "_IntegrationInstanceToStage_B_index" ON "_IntegrationInstanceToStage"("B");

-- AddForeignKey
ALTER TABLE "integration_instances" ADD CONSTRAINT "integration_instances_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IntegrationInstanceToPub" ADD CONSTRAINT "_IntegrationInstanceToPub_A_fkey" FOREIGN KEY ("A") REFERENCES "integration_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IntegrationInstanceToPub" ADD CONSTRAINT "_IntegrationInstanceToPub_B_fkey" FOREIGN KEY ("B") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IntegrationInstanceToStage" ADD CONSTRAINT "_IntegrationInstanceToStage_A_fkey" FOREIGN KEY ("A") REFERENCES "integration_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IntegrationInstanceToStage" ADD CONSTRAINT "_IntegrationInstanceToStage_B_fkey" FOREIGN KEY ("B") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
