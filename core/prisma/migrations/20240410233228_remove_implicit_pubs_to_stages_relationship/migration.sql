/*
  Warnings:

  - You are about to drop the `_PubToStage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PubToStage" DROP CONSTRAINT "_PubToStage_A_fkey";

-- DropForeignKey
ALTER TABLE "_PubToStage" DROP CONSTRAINT "_PubToStage_B_fkey";

-- DropTable
DROP TABLE "_PubToStage";
