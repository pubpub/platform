/*
  Warnings:

  - You are about to drop the `_IntegrationInstanceToStage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_IntegrationInstanceToStage" DROP CONSTRAINT "_IntegrationInstanceToStage_A_fkey";

-- DropForeignKey
ALTER TABLE "_IntegrationInstanceToStage" DROP CONSTRAINT "_IntegrationInstanceToStage_B_fkey";

-- AlterTable
ALTER TABLE "integration_instances" ADD COLUMN     "stage_id" TEXT;

-- DropTable
DROP TABLE "_IntegrationInstanceToStage";

-- AddForeignKey
ALTER TABLE "integration_instances" ADD CONSTRAINT "integration_instances_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
