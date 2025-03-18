/*
  Warnings:

  - You are about to drop the column `integrationId` on the `pub_fields` table. All the data in the column will be lost.
  - You are about to drop the `IntegrationInstanceState` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_IntegrationInstanceToPub` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `integration_instances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `integrations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "IntegrationInstanceState" DROP CONSTRAINT "IntegrationInstanceState_instanceId_fkey";

-- DropForeignKey
ALTER TABLE "IntegrationInstanceState" DROP CONSTRAINT "IntegrationInstanceState_pubId_fkey";

-- DropForeignKey
ALTER TABLE "_IntegrationInstanceToPub" DROP CONSTRAINT "_IntegrationInstanceToPub_A_fkey";

-- DropForeignKey
ALTER TABLE "_IntegrationInstanceToPub" DROP CONSTRAINT "_IntegrationInstanceToPub_B_fkey";

-- DropForeignKey
ALTER TABLE "integration_instances" DROP CONSTRAINT "integration_instances_communityId_fkey";

-- DropForeignKey
ALTER TABLE "integration_instances" DROP CONSTRAINT "integration_instances_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "integration_instances" DROP CONSTRAINT "integration_instances_stageId_fkey";

-- DropForeignKey
ALTER TABLE "pub_fields" DROP CONSTRAINT "pub_fields_integrationId_fkey";

-- AlterTable
ALTER TABLE "pub_fields" DROP COLUMN "integrationId";

-- DropTable
DROP TABLE "IntegrationInstanceState";

-- DropTable
DROP TABLE "_IntegrationInstanceToPub";

-- DropTable
DROP TABLE "integration_instances";

-- DropTable
DROP TABLE "integrations";
