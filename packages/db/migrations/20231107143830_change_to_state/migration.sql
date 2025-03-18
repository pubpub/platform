/*
  Warnings:

  - You are about to drop the column `value` on the `IntegrationInstanceState` table. All the data in the column will be lost.
  - Added the required column `state` to the `IntegrationInstanceState` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "IntegrationInstanceState" DROP COLUMN "value",
ADD COLUMN     "state" JSONB NOT NULL;
